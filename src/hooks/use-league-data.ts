"use client";

import { useEffect, useMemo, useState } from "react";
import fallbackFixtures from "@/data/league-fixtures.json";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { SEEDED_TEAM_PHOTOS } from "@/data/seed-team-photos";
import { fromFirestorePlayer } from "@/lib/firebase/adapters";
import { subscribeToLeagueData } from "@/lib/firebase/public-data";
import type { Match, Player, TeamPhoto } from "@/types/domain";

const LEAGUE_SCHEDULE_OVERRIDES: Record<string, Partial<Pick<Match, "home" | "away" | "date" | "time" | "venue">>> = {
  "clausura-mini-f1-p2": {
    home: "Club Palestino",
    away: "Club Manquehue",
    date: "Viernes 21 de agosto",
    time: "17:00 hrs",
    venue: "Club Palestino",
  },
  "clausura-infantil-f1-p2": {
    home: "Club Palestino",
    away: "Club Manquehue",
    date: "Viernes 21 de agosto",
    time: "18:00 hrs",
    venue: "Club Palestino",
  },
  "clausura-intermedia-f1-p2": {
    home: "Club Palestino",
    away: "Club Manquehue",
    date: "Viernes 21 de agosto",
    time: "19:00 hrs",
    venue: "Club Palestino",
  },
  "clausura-peque-f1-p2": {
    home: "Club Palestino",
    away: "Club Manquehue",
    date: "Sábado 22 de agosto",
    time: "09:00 hrs",
    venue: "Club Palestino",
  },
  "clausura-pre-peque-f1-p2": {
    home: "Club Palestino",
    away: "Club Manquehue",
    date: "Sábado 22 de agosto",
    time: "10:00 hrs",
    venue: "Club Palestino",
  },
};

function applyScheduleOverrides(matches: Match[]) {
  return matches.map((match) => ({ ...match, ...LEAGUE_SCHEDULE_OVERRIDES[match.id] }));
}

const fallbackMatches = applyScheduleOverrides([...(fallbackFixtures as Match[]), ...LFF_FIXTURES]);

function includeLffFixtures(matches: Match[]) {
  return applyScheduleOverrides([
    ...matches.filter((match) => match.competition !== "lff"),
    ...LFF_FIXTURES,
  ]);
}

export function useLeagueData() {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [players, setPlayers] = useState<Player[]>([]);
  const [photos, setPhotos] = useState<TeamPhoto[]>(SEEDED_TEAM_PHOTOS);
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
      const seededIds = new Set(SEEDED_TEAM_PHOTOS.map((photo) => photo.id));
      setPhotos([...SEEDED_TEAM_PHOTOS, ...nextPhotos.filter((photo) => !seededIds.has(photo.id))]);
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
