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

const MATCH_OVERRIDES: Record<
  string,
  Partial<Pick<Match, "home" | "away" | "homeScore" | "awayScore" | "status" | "date" | "time" | "venue" | "events">>
> = {
  "lff-superior-r1-m1": {
    home: "Club Palestino A",
    away: "Country Club B",
    homeScore: 4,
    awayScore: 3,
    status: "played",
    date: "Jueves 20 de agosto",
    time: "19:45 hrs",
    venue: "Palestino",
    events: [
      { id: "pal-soubnit-1", type: "goal", team: "Club Palestino A", player: "Soubnit" },
      { id: "pal-ortiz-1", type: "goal", team: "Club Palestino A", player: "Ortiz" },
      { id: "pal-ortiz-2", type: "goal", team: "Club Palestino A", player: "Ortiz" },
      { id: "pal-martinez-1", type: "goal", team: "Club Palestino A", player: "Martínez" },
      { id: "country-pena-1", type: "goal", team: "Country Club B", player: "Peña" },
      { id: "country-pena-2", type: "goal", team: "Country Club B", player: "Peña" },
      { id: "country-riveros-1", type: "goal", team: "Country Club B", player: "Riveros" },
    ],
  },
  "lff-superior-r1-m2": {
    home: "Estadio Español",
    away: "Equipo Médico",
    homeScore: 2,
    awayScore: 1,
    status: "played",
    date: "Miércoles 19 de agosto",
    time: "19:45 hrs",
    venue: "Estadio Español",
    events: [
      { id: "esp-arancibia-1", type: "goal", team: "Estadio Español", player: "Arancibia" },
      { id: "esp-arancibia-2", type: "goal", team: "Estadio Español", player: "Arancibia" },
      { id: "med-swett-1", type: "goal", team: "Equipo Médico", player: "Swett" },
    ],
  },
  "lff-superior-r1-m3": {
    home: "Stadio Italiano",
    away: "Sport Academy",
    homeScore: 5,
    awayScore: 0,
    status: "played",
    date: "Miércoles 19 de agosto",
    time: "18:45 hrs",
    venue: "Stadio Italiano",
    events: [
      { id: "ita-serre-1", type: "goal", team: "Stadio Italiano", player: "Serre" },
      { id: "ita-serre-2", type: "goal", team: "Stadio Italiano", player: "Serre" },
      { id: "ita-ormeno-1", type: "goal", team: "Stadio Italiano", player: "Ormeño" },
      { id: "ita-ormeno-2", type: "goal", team: "Stadio Italiano", player: "Ormeño" },
      { id: "ita-mierzo-1", type: "goal", team: "Stadio Italiano", player: "Mierzo" },
    ],
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
      events: [],
      ...MATCH_OVERRIDES[id],
    };
  }),
);
