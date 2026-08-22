"use client";

import { useEffect, useMemo, useState } from "react";
import fallbackFixtures from "@/data/league-fixtures.json";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { SEEDED_TEAM_PHOTOS } from "@/data/seed-team-photos";
import { fromFirestorePlayer } from "@/lib/firebase/adapters";
import { subscribeToLeagueData } from "@/lib/firebase/public-data";
import { normalizeClubName } from "@/lib/text";
import type { Match, Player, TeamPhoto } from "@/types/domain";

const fallbackMatches = [...(fallbackFixtures as Match[]), ...LFF_FIXTURES];

function matchIdentity(match: Match) {
  return [
    match.competition,
    match.category,
    match.round,
    normalizeClubName(match.home),
    normalizeClubName(match.away),
  ].join("|");
}

function preferredLiveMatch(matches: Match[], fallbackId?: string) {
  return [...matches].sort((a, b) => {
    const played = Number(b.status === "played") - Number(a.status === "played");
    if (played) return played;
    return Number(b.id === fallbackId) - Number(a.id === fallbackId);
  })[0];
}

export function mergeMatchesWithFallback(liveMatches: Match[]) {
  const liveByIdentity = new Map<string, Match[]>();
  for (const match of liveMatches) {
    const identity = matchIdentity(match);
    liveByIdentity.set(identity, [...(liveByIdentity.get(identity) ?? []), match]);
  }

  const fallbackIdentities = new Set(fallbackMatches.map(matchIdentity));
  const merged = fallbackMatches.map((match) => {
    const liveMatchesForFixture = liveByIdentity.get(matchIdentity(match));
    return liveMatchesForFixture?.length ? preferredLiveMatch(liveMatchesForFixture, match.id) : match;
  });
  const additional = [...liveByIdentity.entries()]
    .filter(([identity]) => !fallbackIdentities.has(identity))
    .map(([, matches]) => preferredLiveMatch(matches));

  return [...merged, ...additional];
}

export function useLeagueData() {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [players, setPlayers] = useState<Player[]>([]);
  const [photos, setPhotos] = useState<TeamPhoto[]>(SEEDED_TEAM_PHOTOS);
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToLeagueData({
    matches: (nextMatches) => {
      setMatches(mergeMatchesWithFallback(nextMatches));
      setStatus("live");
      setError(null);
    },
    players: (nextPlayers) => {
      setPlayers(nextPlayers);
      setStatus("live");
      setError(null);
    },
    photos: (nextPhotos) => {
      const seededIds = new Set(SEEDED_TEAM_PHOTOS.map((photo) => photo.id));
      setPhotos([...SEEDED_TEAM_PHOTOS, ...nextPhotos.filter((photo) => !seededIds.has(photo.id))]);
      setStatus("live");
      setError(null);
    },
    error: async () => {
      const fallbackPlayers = await import("@/data/legacy-players.json");
      setMatches(fallbackMatches);
      setPlayers(fallbackPlayers.default.flatMap((player, index) => {
        const mapped = fromFirestorePlayer(String(player.id ?? `fallback-${index}`), player);
        return mapped ? [mapped] : [];
      }));
      setStatus("fallback");
      setError("No pudimos conectar con Firebase. Mostramos el último respaldo disponible.");
    },
  }), []);

  return useMemo(() => ({ matches, players, photos, status, error }), [matches, players, photos, status, error]);
}
