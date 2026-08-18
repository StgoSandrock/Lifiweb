"use client";

import { useEffect, useMemo, useState } from "react";
import fallbackFixtures from "@/data/league-fixtures.json";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { SEEDED_TEAM_PHOTOS } from "@/data/seed-team-photos";
import { fromFirestorePlayer } from "@/lib/firebase/adapters";
import { subscribeToLeagueData } from "@/lib/firebase/public-data";
import type { Match, Player, TeamPhoto } from "@/types/domain";

const fallbackMatches = [...(fallbackFixtures as Match[]), ...LFF_FIXTURES];

function mergeMatchesWithFallback(liveMatches: Match[]) {
  const liveById = new Map(liveMatches.map((match) => [match.id, match]));
  const merged = fallbackMatches.map((match) => liveById.get(match.id) ?? match);
  const fallbackIds = new Set(fallbackMatches.map((match) => match.id));
  return [...merged, ...liveMatches.filter((match) => !fallbackIds.has(match.id))];
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
