"use client";

import { useEffect, useMemo, useState } from "react";
import fallbackFixtures from "@/data/league-fixtures.json";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { fromFirestorePlayer } from "@/lib/firebase/adapters";
import { subscribeToLeagueData } from "@/lib/firebase/public-data";
import type { Match, Player, TeamPhoto } from "@/types/domain";

const fallbackMatches = [...(fallbackFixtures as Match[]), ...LFF_FIXTURES];

function includeLffFixtures(matches: Match[]) {
  const liveIds = new Set(matches.map((match) => match.id));
  return [...matches, ...LFF_FIXTURES.filter((match) => !liveIds.has(match.id))];
}

export function useLeagueData() {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [players, setPlayers] = useState<Player[]>([]);
  const [photos, setPhotos] = useState<TeamPhoto[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToLeagueData({
    matches: (nextMatches) => {
      setMatches(includeLffFixtures(nextMatches));
      setStatus("live");
      setError(null);
    },
    players: (nextPlayers) => {
      setPlayers(nextPlayers);
      setStatus("live");
      setError(null);
    },
    photos: (nextPhotos) => {
      setPhotos(nextPhotos);
      setStatus("live");
      setError(null);
    },
    error: async () => {
      const fallbackPlayers = await import("@/data/legacy-players.json");
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
