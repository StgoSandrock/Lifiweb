"use client";

import { useEffect, useMemo, useState } from "react";
import fallbackFixtures from "@/data/league-fixtures.json";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { CUP_FIXTURES } from "@/data/cup-fixtures";
import { OFFICIAL_PLAYER_STATS } from "@/data/official-player-stats";
import { OFFICIAL_ROSTER_PLAYERS, REMOVED_ROSTER_PLAYERS } from "@/data/official-roster-updates";
import { SEEDED_TEAM_PHOTOS } from "@/data/seed-team-photos";
import { fromFirestorePlayer } from "@/lib/firebase/adapters";
import { derivePlayerGoals } from "@/lib/goal-events";
import { subscribeToLeagueData } from "@/lib/firebase/public-data";
import { normalizeClubName } from "@/lib/text";
import type { Match, Player, TeamPhoto, TeamRegistration } from "@/types/domain";

function homeVenueForClub(home: string) {
  const club = normalizeClubName(home);
  if (club === "Club Palestino" || club === "Club Palestino A" || club === "Club Palestino B") return "Palestino";
  if (club === "Club Manquehue" || club === "Club Deportivo Manquehue") return "Manquehue";
  if (club === "Stadio Italiano") return "Stadio Italiano";
  return null;
}

function withOfficialHomeVenue(match: Match): Match {
  const venue = homeVenueForClub(match.home);
  return venue && !match.venue ? { ...match, venue } : match;
}

const fallbackMatches = [...(fallbackFixtures as Match[]), ...CUP_FIXTURES, ...LFF_FIXTURES].map(withOfficialHomeVenue);

function matchIdentity(match: Match) {
  const clubs = [normalizeClubName(match.home), normalizeClubName(match.away)].sort();
  return [
    match.competition,
    match.category,
    match.round,
    ...clubs,
  ].join("|");
}

function preferredLiveMatch(matches: Match[], fallbackId?: string) {
  return [...matches].sort((a, b) => {
    const played = Number(b.status === "played") - Number(a.status === "played");
    if (played) return played;
    return Number(b.id === fallbackId) - Number(a.id === fallbackId);
  })[0];
}

function withFallbackDetails(live: Match, fallback: Match): Match {
  if (fallback.status === "played" && !live.updatedBy) {
    return withOfficialHomeVenue({
      ...fallback,
      id: live.id,
      date: fallback.date ?? live.date,
      time: fallback.time ?? live.time,
      venue: fallback.venue ?? live.venue,
      events: fallback.events?.length ? fallback.events : live.events,
    });
  }

  return withOfficialHomeVenue({
    ...fallback,
    ...live,
    date: live.date ?? fallback.date,
    time: live.time ?? fallback.time,
    venue: live.venue ?? fallback.venue,
    homePenalties: live.homePenalties ?? fallback.homePenalties,
    awayPenalties: live.awayPenalties ?? fallback.awayPenalties,
    events: live.events?.length ? live.events : fallback.events,
  });
}

export function mergeMatchesWithFallback(liveMatches: Match[], deletedIds: string[] = [], deletedMatches: Match[] = []) {
  const liveByIdentity = new Map<string, Match[]>();
  for (const match of liveMatches) {
    const identity = matchIdentity(match);
    liveByIdentity.set(identity, [...(liveByIdentity.get(identity) ?? []), match]);
  }

  const fallbackIdentities = new Set(fallbackMatches.map(matchIdentity));
  const merged = fallbackMatches.map((match) => {
    const liveMatchesForFixture = liveByIdentity.get(matchIdentity(match));
    return liveMatchesForFixture?.length
      ? withFallbackDetails(preferredLiveMatch(liveMatchesForFixture, match.id), match)
      : match;
  });
  const additional = [...liveByIdentity.entries()]
    .filter(([identity]) => !fallbackIdentities.has(identity))
    .map(([, matches]) => withOfficialHomeVenue(preferredLiveMatch(matches)));

  const withdrawn = new Set(deletedMatches.map(matchIdentity));
  return [...merged, ...additional].filter(match => !deletedIds.includes(match.id) && !withdrawn.has(matchIdentity(match)));
}

function playerIdentity(player: Player) {
  return [player.competition, player.category, normalizeClubName(player.club), player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()].join("|");
}

export function mergePlayersWithOfficialStats(livePlayers: Player[], deletedIds: string[] = [], deletedPlayers: Player[] = []) {
  const merged = new Map(livePlayers
    .filter((player) => !REMOVED_ROSTER_PLAYERS.has(playerIdentity(player)))
    .map((player) => [playerIdentity(player), player]));
  for (const official of OFFICIAL_ROSTER_PLAYERS) {
    const identity = playerIdentity(official);
    if (!merged.has(identity)) merged.set(identity, official);
  }
  for (const official of OFFICIAL_PLAYER_STATS) {
    const identity = playerIdentity(official);
    const live = merged.get(identity);
    merged.set(identity, live ? {
      ...live,
      goals: Math.max(live.goals, official.goals),
      assists: Math.max(live.assists, official.assists),
      appearances: Math.max(live.appearances, official.appearances),
      yellowCards: Math.max(live.yellowCards, official.yellowCards),
      redCards: Math.max(live.redCards, official.redCards),
    } : official);
  }
  const removedIdentities = new Set(deletedPlayers.map(playerIdentity));
  return [...merged.values()].filter(p => !deletedIds.includes(p.id) && !removedIdentities.has(playerIdentity(p)));
}

export function useLeagueData() {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [rawPlayers, setRawPlayers] = useState<Player[]>([]);
  const [photos, setPhotos] = useState<TeamPhoto[]>(SEEDED_TEAM_PHOTOS);
  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const received = new Set<string>();
    let failed = false, disposed = false;
    const connected = (name: string) => { received.add(name); if (!failed && received.size === 4) { setStatus("live"); setError(null); } };
    const unsubscribe = subscribeToLeagueData({
    matches: (nextMatches, deletedIds, deletedMatches) => {
      setMatches(mergeMatchesWithFallback(nextMatches, deletedIds, deletedMatches));
      connected("matches");
    },
    players: (nextPlayers, deletedIds, deletedPlayers) => {
      setRawPlayers(mergePlayersWithOfficialStats(nextPlayers, deletedIds, deletedPlayers));
      connected("players");
    },
    photos: (nextPhotos) => {
      const seededIds = new Set(SEEDED_TEAM_PHOTOS.map((photo) => photo.id));
      setPhotos([...SEEDED_TEAM_PHOTOS, ...nextPhotos.filter((photo) => !seededIds.has(photo.id))]);
      connected("photos");
    },
    teams: (nextTeams) => {
      setTeams(nextTeams);
      connected("teams");
    },
    error: async () => {
      failed = true;
      setStatus("fallback");
      setError("Conexión incompleta con Firebase. La edición está deshabilitada; los datos pueden estar desactualizados.");
      // Never replace a received live snapshot (including withdrawals) with older bundled data.
      if (!received.has("players")) {
        const fallbackPlayers = await import("@/data/legacy-players.json");
        if (disposed || received.has("players")) return;
        setRawPlayers(mergePlayersWithOfficialStats(fallbackPlayers.default.flatMap((player, index) => {
          const mapped = fromFirestorePlayer(String(player.id ?? `fallback-${index}`), player);
          return mapped ? [mapped] : [];
        })));
      }
    },
  });
    return () => { disposed = true; unsubscribe(); };
  }, []);

  const players = useMemo(() => derivePlayerGoals(rawPlayers, matches), [rawPlayers, matches]);
  return useMemo(() => ({ matches, players, photos, teams, status, error }), [matches, players, photos, teams, status, error]);
}
