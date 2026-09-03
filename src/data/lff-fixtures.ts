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
  Partial<Pick<Match, "home" | "away" | "homeScore" | "awayScore" | "homePenalties" | "awayPenalties" | "status" | "date" | "time" | "venue" | "events">>
> = {
  "lff-superior-r1-m1": {
    home: "Club Palestino A",
    away: "Country Club B",
    homeScore: 0,
    awayScore: 0,
    homePenalties: 3,
    awayPenalties: 2,
    status: "played",
    date: "Jueves 20 de agosto",
    time: "19:45 hrs",
    venue: "Palestino",
    events: [],
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
    home: "Club Palestino B",
    away: "Country Club A",
    homeScore: 4,
    awayScore: 3,
    status: "played",
    date: "Miércoles 19 de agosto",
    time: "19:45 hrs",
    venue: "Palestino",
    events: [
      { id: "palb-soubnit-1", type: "goal", team: "Club Palestino B", player: "Soubnit" },
      { id: "palb-ortiz-1", type: "goal", team: "Club Palestino B", player: "Ortiz" },
      { id: "palb-ortiz-2", type: "goal", team: "Club Palestino B", player: "Ortiz" },
      { id: "palb-martinez-1", type: "goal", team: "Club Palestino B", player: "Martínez" },
      { id: "countrya-pena-1", type: "goal", team: "Country Club A", player: "Peña" },
      { id: "countrya-pena-2", type: "goal", team: "Country Club A", player: "Peña" },
      { id: "countrya-riveros-1", type: "goal", team: "Country Club A", player: "Riveros" },
    ],
  },
  "lff-superior-r2-m1": {
    home: "Country Club B",
    away: "Estadio Español",
    homeScore: 1,
    awayScore: 1,
    homePenalties: 2,
    awayPenalties: 1,
    status: "played",
    date: "Lunes 24 de agosto",
    events: [
      { id: "countryb-garcia-a-1", type: "goal", team: "Country Club B", player: "García A." },
      { id: "esp-baltra-1", type: "goal", team: "Estadio Español", player: "Baltra" },
    ],
  },
  "lff-superior-r2-m2": {
    home: "Club Deportivo Manquehue",
    away: "Stadio Italiano",
    homeScore: 4,
    awayScore: 3,
    status: "played",
    date: "Lunes 24 de agosto",
    events: [
      { id: "manquehue-sepulveda-1", type: "goal", team: "Club Deportivo Manquehue", player: "Sepúlveda" },
      { id: "manquehue-martinez-1", type: "goal", team: "Club Deportivo Manquehue", player: "Martínez" },
      { id: "manquehue-zach-1", type: "goal", team: "Club Deportivo Manquehue", player: "Zach" },
      { id: "manquehue-zach-2", type: "goal", team: "Club Deportivo Manquehue", player: "Zach" },
      { id: "italiano-ormeno-r2-1", type: "goal", team: "Stadio Italiano", player: "Ormeño" },
      { id: "italiano-karmenic-1", type: "goal", team: "Stadio Italiano", player: "Karmenic" },
      { id: "italiano-karmenic-2", type: "goal", team: "Stadio Italiano", player: "Karmenic" },
    ],
  },
  "lff-superior-r3-m1": {
    home: "Country Club B",
    away: "Sport Academy",
    homeScore: 1,
    awayScore: 0,
    status: "played",
    events: [
      { id: "countryb-zuniga-r3-1", type: "goal", team: "Country Club B", player: "Zuniga" },
    ],
  },
  "lff-superior-r3-m2": {
    home: "Stadio Italiano",
    away: "Club Palestino B",
    homeScore: 4,
    awayScore: 1,
    status: "played",
    date: "Miércoles 2 de septiembre",
    events: [
      { id: "italiano-ormeno-r3-1", type: "goal", team: "Stadio Italiano", player: "Ormeño" },
      { id: "italiano-ormeno-r3-2", type: "goal", team: "Stadio Italiano", player: "Ormeño" },
      { id: "italiano-kamelich-r3-1", type: "goal", team: "Stadio Italiano", player: "Kamelich" },
      { id: "italiano-ramos-r3-1", type: "goal", team: "Stadio Italiano", player: "Ramos" },
      { id: "palb-ortiz-r3-1", type: "goal", team: "Club Palestino B", player: "Ortiz" },
    ],
  },
  "lff-superior-r3-m3": {
    home: "Club Deportivo Manquehue",
    away: "Club Palestino A",
    homeScore: 3,
    awayScore: 1,
    status: "played",
    events: [],
  },
  "lff-superior-r3-m4": {
    home: "Country Club A",
    away: "Estadio Español",
    homeScore: 3,
    awayScore: 0,
    status: "played",
    events: [
      { id: "countrya-fontecilla-r3-1", type: "goal", team: "Country Club A", player: "Fontecilla" },
      { id: "countrya-briones-r3-1", type: "goal", team: "Country Club A", player: "Briones" },
      { id: "countrya-briones-r3-2", type: "goal", team: "Country Club A", player: "Briones" },
    ],
  },
};

function defaultVenueForHome(home: string) {
  if (home === "Club Palestino A" || home === "Club Palestino B") return "Palestino";
  if (home === "Club Deportivo Manquehue") return "Manquehue";
  if (home === "Stadio Italiano") return "Stadio Italiano";
  return null;
}

export const LFF_FIXTURES: Match[] = SOURCE_ROUNDS.flatMap((matches, roundIndex) =>
  matches.map(([sourceHome, sourceAway], order) => {
    const id = `lff-superior-r${roundIndex + 1}-m${order + 1}`;
    const override = MATCH_OVERRIDES[id] ?? {};
    const home = override.home ?? sourceAway;

    return {
      id,
      tournament: "clausura" as const,
      competition: "lff" as const,
      category: "superior" as const,
      round: roundIndex + 1,
      order: order + 1,
      home,
      away: sourceHome,
      homeScore: null,
      awayScore: null,
      homePenalties: null,
      awayPenalties: null,
      status: "scheduled" as const,
      date: null,
      time: null,
      venue: defaultVenueForHome(home),
      events: [],
      ...override,
    };
  }),
);
