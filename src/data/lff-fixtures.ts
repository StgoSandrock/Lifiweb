import type { Match } from "@/types/domain";

// El documento oficial lista primero al local original. La web publica cada
// cruce con la localía invertida por defecto, salvo ajustes confirmados.
const SOURCE_ROUNDS: ReadonlyArray<ReadonlyArray<readonly [string, string]>> = [
  [
    ["Club Palestino A", "Country Club B"],
    ["Estadio Español", "Equipo Médico"],
    ["Stadio Italiano", "Sport Academy"],
    ["Country Club A", "Club Palestino B"],
  ],
  [
    ["Estadio Español", "Country Club B"],
    ["Stadio Italiano", "Club Deportivo Manquehue"],
    ["Country Club A", "Equipo Médico"],
    ["Club Palestino A", "Sport Academy"],
  ],
  [
    ["Country Club B", "Sport Academy"],
    ["Stadio Italiano", "Club Palestino B"],
    ["Club Palestino A", "Club Deportivo Manquehue"],
    ["Estadio Español", "Country Club A"],
  ],
  [
    ["Country Club B", "Club Deportivo Manquehue"],
    ["Estadio Español", "Sport Academy"],
    ["Club Palestino A", "Club Palestino B"],
    ["Equipo Médico", "Stadio Italiano"],
  ],
  [
    ["Country Club B", "Club Palestino B"],
    ["Sport Academy", "Club Deportivo Manquehue"],
    ["Country Club A", "Stadio Italiano"],
    ["Club Palestino A", "Equipo Médico"],
  ],
  [
    ["Estadio Español", "Club Deportivo Manquehue"],
    ["Club Palestino B", "Sport Academy"],
  ],
  [
    ["Club Deportivo Manquehue", "Club Palestino B"],
    ["Country Club A", "Club Palestino A"],
  ],
  [
    ["Club Deportivo Manquehue", "Equipo Médico"],
    ["Estadio Español", "Stadio Italiano"],
    ["Country Club B", "Equipo Médico"],
    ["Stadio Italiano", "Club Palestino A"],
  ],
  [
    ["Estadio Español", "Club Palestino A"],
    ["Country Club A", "Sport Academy"],
    ["Estadio Español", "Club Palestino B"],
    ["Stadio Italiano", "Country Club B"],
  ],
];

const MATCH_OVERRIDES: Record<string, Partial<Pick<Match, "home" | "away" | "date" | "time" | "venue">>> = {
  "lff-superior-r1-m1": {
    home: "Club Palestino A",
    away: "Country Club B",
    date: "Jueves 20 de agosto",
    time: "19:45 hrs",
    venue: "Palestino",
  },
  "lff-superior-r1-m2": {
    home: "Estadio Español",
    away: "Equipo Médico",
    date: "Miércoles 19 de agosto",
    time: "19:45 hrs",
    venue: "Estadio Español",
  },
  "lff-superior-r1-m3": {
    home: "Stadio Italiano",
    away: "Sport Academy",
    date: "Miércoles 19 de agosto",
    time: "18:45 hrs",
    venue: "Stadio Italiano",
  },
  "lff-superior-r1-m4": {
    date: "Miércoles 19 de agosto",
    time: "19:45 hrs",
  },
};

export const LFF_FIXTURES: Match[] = SOURCE_ROUNDS.flatMap((matches, roundIndex) =>
  matches.map(([sourceHome, sourceAway], order) => {
    const id = `lff-superior-r${roundIndex + 1}-m${order + 1}`;

    return {
      id,
      tournament: "clausura" as const,
      competition: "lff" as const,
      category: "superior" as const,
      round: roundIndex + 1,
      order: order + 1,
      home: sourceAway,
      away: sourceHome,
      homeScore: null,
      awayScore: null,
      status: "scheduled" as const,
      date: null,
      time: null,
      venue: null,
      ...MATCH_OVERRIDES[id],
    };
  }),
);
