import type { Match } from "@/types/domain";

// El documento oficial lista primero al local original. La web publica cada
// cruce con la localía invertida, según la instrucción recibida.
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

export const LFF_FIXTURES: Match[] = SOURCE_ROUNDS.flatMap((matches, roundIndex) =>
  matches.map(([sourceHome, sourceAway], order) => ({
    id: `lff-superior-r${roundIndex + 1}-m${order + 1}`,
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
  })),
);
