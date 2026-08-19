"use client";

import { useEffect, useMemo, useState } from "react";
import fallbackFixtures from "@/data/league-fixtures.json";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { SEEDED_TEAM_PHOTOS } from "@/data/seed-team-photos";
import { fromFirestorePlayer } from "@/lib/firebase/adapters";
import { subscribeToLeagueData } from "@/lib/supabase/public-data";
import type { Match, Player, TeamPhoto } from "@/types/domain";

const fallbackMatches = [...(fallbackFixtures as Match[]), ...LFF_FIXTURES];

export function useLeagueData() {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [players, setPlayers] = useState<Player[]>([]);
  const [photos, setPhotos] = useState<TeamPhoto[]>(SEEDED_TEAM_PHOTOS);
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToLeagueData({
    matches: (nextMatches) => {
      setMatches(nextMatches);
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
      setMatches(fallbackMatches);
      setPlayers(fallbackPlayers.default.flatMap((player, index) => {
        const mapped = fromFirestorePlayer(String(player.id ?? `fallback-${index}`), player);
        return mapped ? [mapped] : [];
      }));
      setPhotos(SEEDED_TEAM_PHOTOS);
      setStatus("fallback");
      setError("No pudimos conectar con Supabase. Mostramos el último respaldo disponible.");
    },
  }), []);

  return useMemo(() => ({ matches, players, photos, status, error }), [matches, players, photos, status, error]);
}
