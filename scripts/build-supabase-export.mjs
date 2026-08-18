import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

const CATEGORY_ROWS = [
  { id: "pre-peque", name: "Pre-Peque", birth_years: "2017–2018", sort_order: 1, active: true },
  { id: "peque", name: "Peque", birth_years: "2015–2016", sort_order: 2, active: true },
  { id: "mini", name: "Mini", birth_years: "2013–2014", sort_order: 3, active: true },
  { id: "infantil", name: "Infantil", birth_years: "2011–2012", sort_order: 4, active: true },
  { id: "intermedia", name: "Intermedia", birth_years: "2009–2010", sort_order: 5, active: true },
  { id: "superior", name: "Superior", birth_years: "Categoría única", sort_order: 6, active: true },
];
const CATEGORY_IDS = new Set(CATEGORY_ROWS.map((row) => row.id));

const LEAGUE_CLUBS = [
  { id: "israelita", name: "Estadio Israelita", aliases: ["Israelita"], logo: "/clubs/israelita.svg" },
  { id: "espanol", name: "Estadio Español", aliases: ["Estadio Espanol", "Español"], logo: "/clubs/espanol.svg" },
  { id: "manquehue", name: "Club Manquehue", aliases: ["Manquehue"], logo: "/clubs/manquehue.svg" },
  { id: "palestino", name: "Club Palestino", aliases: ["Palestino"], logo: "/clubs/palestino.svg" },
  { id: "bianconero", name: "Bianconero", aliases: [], logo: "/clubs/bianconero.svg" },
  { id: "italiano", name: "Stadio Italiano", aliases: ["Stadio", "Italiano"], logo: "/clubs/italiano.svg" },
  { id: "lif", name: "LIF", aliases: ["L.I.F."], logo: "/clubs/lif.svg" },
  { id: "ultimate", name: "Ultimate S.A.", aliases: ["Ultimate S.A", "Ultimate"], logo: "/clubs/ultimate.svg" },
  { id: "croata", name: "Estadio Croata", aliases: ["Croata"], logo: "/clubs/croata.svg" },
  { id: "inter", name: "Inter", aliases: [], logo: "/clubs/inter.svg" },
];

const LFF_CLUBS = [
  { id: "lff-palestino-a", name: "Club Palestino A", aliases: [], logo: "/clubs/palestino.svg" },
  { id: "lff-palestino-b", name: "Club Palestino B", aliases: [], logo: "/clubs/palestino.svg" },
  { id: "lff-equipo-medico", name: "Equipo Médico", aliases: ["Equipo Medico"], logo: "/clubs/equipo-medico.png" },
  { id: "lff-manquehue", name: "Club Deportivo Manquehue", aliases: [], logo: "/clubs/manquehue.svg" },
  { id: "lff-estadio-espanol", name: "Estadio Español", aliases: ["Estadio Espanol"], logo: "/clubs/espanol.svg" },
  { id: "lff-stadio-italiano", name: "Stadio Italiano", aliases: [], logo: "/clubs/italiano.svg" },
  { id: "lff-country-club-a", name: "Country Club A", aliases: [], logo: "/clubs/country-club.png" },
  { id: "lff-country-club-b", name: "Country Club B", aliases: [], logo: "/clubs/country-club.png" },
  { id: "lff-sport-academy", name: "Sport Academy", aliases: [], logo: "" },
];

const SEEDED_TEAM_PHOTOS = [
  ["seed-inter-intermedia-5038", "league", "intermedia", "Inter", "/team-galleries/league/intermedia/inter/img-5038.jpeg", "static/team-galleries/league/intermedia/inter/img-5038.jpeg", 1],
  ["seed-ultimate-infantil-5025", "league", "infantil", "Ultimate S.A.", "/team-galleries/league/infantil/ultimate/img-5025.jpeg", "static/team-galleries/league/infantil/ultimate/img-5025.jpeg", 1],
  ["seed-manquehue-pre-peque-5044", "league", "pre-peque", "Club Manquehue", "/team-galleries/league/pre-peque/manquehue/img-5044.jpeg", "static/team-galleries/league/pre-peque/manquehue/img-5044.jpeg", 1],
  ["seed-manquehue-infantil-5031", "league", "infantil", "Club Manquehue", "/team-galleries/league/infantil/manquehue/img-5031.jpeg", "static/team-galleries/league/infantil/manquehue/img-5031.jpeg", 1],
  ["seed-manquehue-intermedia-equipo-2026", "league", "intermedia", "Club Manquehue", "/team-galleries/league/intermedia/manquehue/equipo-intermedia.jpeg", "static/team-galleries/league/intermedia/manquehue/equipo-intermedia.jpeg", 1],
  ["seed-lff-manquehue-superior-equipo", "lff", "superior", "Club Deportivo Manquehue", "/team-galleries/lff/superior/manquehue/foto-equipo.jpg", "static/team-galleries/lff/superior/manquehue/foto-equipo.jpg", 1],
].map(([id, competition, category, club, url, storagePath, order]) => ({ id, competition, category, club, url, storagePath, order }));

const LFF_SOURCE_ROUNDS = [
  [["Club Palestino A", "Country Club B"], ["Estadio Español", "Equipo Médico"], ["Stadio Italiano", "Sport Academy"], ["Country Club A", "Club Palestino B"]],
  [["Estadio Español", "Country Club B"], ["Stadio Italiano", "Club Deportivo Manquehue"], ["Country Club A", "Equipo Médico"], ["Club Palestino A", "Sport Academy"]],
  [["Country Club B", "Sport Academy"], ["Stadio Italiano", "Club Palestino B"], ["Club Palestino A", "Club Deportivo Manquehue"], ["Estadio Español", "Country Club A"]],
  [["Country Club B", "Club Deportivo Manquehue"], ["Estadio Español", "Sport Academy"], ["Club Palestino A", "Club Palestino B"], ["Equipo Médico", "Stadio Italiano"]],
  [["Country Club B", "Club Palestino B"], ["Sport Academy", "Club Deportivo Manquehue"], ["Country Club A", "Stadio Italiano"], ["Club Palestino A", "Equipo Médico"]],
  [["Estadio Español", "Club Deportivo Manquehue"], ["Club Palestino B", "Sport Academy"]],
  [["Club Deportivo Manquehue", "Club Palestino B"], ["Country Club A", "Club Palestino A"]],
  [["Club Deportivo Manquehue", "Equipo Médico"], ["Estadio Español", "Stadio Italiano"], ["Country Club B", "Equipo Médico"], ["Stadio Italiano", "Club Palestino A"]],
  [["Estadio Español", "Club Palestino A"], ["Country Club A", "Sport Academy"], ["Estadio Español", "Club Palestino B"], ["Stadio Italiano", "Country Club B"]],
];

const LFF_OVERRIDES = {
  "lff-superior-r1-m1": { home: "Club Palestino A", away: "Country Club B", date: "Jueves 20 de agosto", time: "19:45 hrs", venue: "Palestino" },
  "lff-superior-r1-m2": { home: "Estadio Español", away: "Equipo Médico", date: "Miércoles 19 de agosto", time: "19:45 hrs", venue: "Estadio Español" },
  "lff-superior-r1-m3": { home: "Sport Academy", away: "Stadio Italiano", date: "Miércoles 19 de agosto", time: "18:45 hrs", venue: "Stadio Italiano" },
  "lff-superior-r1-m4": { date: "Miércoles 19 de agosto", time: "19:45 hrs" },
};

function buildLffFixtures() {
  return LFF_SOURCE_ROUNDS.flatMap((matches, roundIndex) => matches.map(([sourceHome, sourceAway], order) => {
    const id = `lff-superior-r${roundIndex + 1}-m${order + 1}`;
    return {
      id,
      tournament: "clausura",
      competition: "lff",
      category: "superior",
      round: roundIndex + 1,
      order: order + 1,
      home: sourceAway,
      away: sourceHome,
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      date: null,
      time: null,
      venue: null,
      ...(LFF_OVERRIDES[id] ?? {}),
    };
  }));
}

function compactText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeKey(value) {
  return compactText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slug(value) {
  return normalizeKey(value).replace(/\s+/g, "-") || "club";
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function nullableText(value) {
  const text = compactText(value);
  return text && text !== "Por definir" ? text : null;
}

function competitionFrom(raw, legacyCupKey) {
  if (["league", "cup", "lff"].includes(raw.competition)) return raw.competition;
  return raw[legacyCupKey] === true ? "cup" : "league";
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeFirestoreValue);
  if ("mapValue" in value) return decodeFirestoreFields(value.mapValue.fields ?? {});
  return null;
}

function decodeFirestoreFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(ROOT, relativePath), "utf8"));
}

async function listFirestoreCollection(collectionName) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const artifactId = process.env.NEXT_PUBLIC_FIREBASE_ARTIFACT_ID;
  if (!apiKey || !projectId || !artifactId) throw new Error("Faltan variables Firebase: el export normalizado exige leer Firestore en vivo.");

  const documents = [];
  let pageToken = "";
  do {
    const path = `artifacts/${artifactId}/public/data/${collectionName}`;
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`);
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Firestore ${collectionName}: HTTP ${response.status} ${await response.text()}`);
    const payload = await response.json();
    for (const document of payload.documents ?? []) {
      documents.push({ id: document.name.split("/").pop(), ...decodeFirestoreFields(document.fields ?? {}) });
    }
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken);
  return documents;
}

function mergeById(fallbackRows, liveRows) {
  const merged = new Map(fallbackRows.map((row) => [String(row.id), row]));
  for (const row of liveRows) merged.set(String(row.id), row);
  return [...merged.values()];
}

function createClubRegistry() {
  const rows = new Map();
  const competitions = new Map();
  const standardLookup = new Map();
  const lffLookup = new Map();

  const addCompetition = (clubId, competition) => competitions.set(`${clubId}|${competition}`, { club_id: clubId, competition });
  const registerNames = (lookup, club) => {
    for (const name of [club.name, ...(club.aliases ?? [])]) lookup.set(normalizeKey(name), club.id);
  };
  const register = (club, comps, lookup) => {
    rows.set(club.id, { ...club, aliases: club.aliases ?? [], logo: club.logo ?? "", active: true });
    registerNames(lookup, club);
    for (const comp of comps) addCompetition(club.id, comp);
  };

  for (const club of LEAGUE_CLUBS) register(club, ["league", "cup"], standardLookup);
  for (const club of LFF_CLUBS) register(club, ["lff"], lffLookup);

  function ensure(name, competition) {
    const cleanName = compactText(name);
    if (!cleanName) throw new Error(`Club vacío en competencia ${competition}.`);
    const lookup = competition === "lff" ? lffLookup : standardLookup;
    const key = normalizeKey(cleanName);
    const existing = lookup.get(key);
    if (existing) {
      addCompetition(existing, competition);
      return existing;
    }

    const baseId = `${competition === "lff" ? "lff" : "club"}-${slug(cleanName)}`;
    let id = baseId;
    let suffix = 2;
    while (rows.has(id)) id = `${baseId}-${suffix++}`;
    const club = { id, name: cleanName, aliases: [], logo: "", active: true };
    register(club, [competition], lookup);
    return id;
  }

  return { ensure, rows, competitions };
}

function scanAndRegisterClubs(registry, players, matches, photos) {
  for (const raw of players) registry.ensure(raw.club, competitionFrom(raw, "cupPlayer"));
  for (const raw of matches) {
    const competition = competitionFrom(raw, "isCup");
    registry.ensure(raw.local ?? raw.home, competition);
    registry.ensure(raw.visita ?? raw.away, competition);
  }
  for (const raw of photos) registry.ensure(raw.club, raw.competition);
}

function targetPlayer(id, raw, registry) {
  const competition = competitionFrom(raw, "cupPlayer");
  const categoryId = compactText(raw.categoria ?? raw.category);
  const name = compactText(raw.nombre ?? raw.name);
  if (!id || !name || !CATEGORY_IDS.has(categoryId)) throw new Error(`Jugador inválido: ${id || "sin-id"} / ${name || "sin-nombre"} / ${categoryId || "sin-categoria"}`);
  return {
    id,
    name,
    position: compactText(raw.posicion ?? raw.position) || "Jugador",
    club_id: registry.ensure(raw.club, competition),
    category_id: categoryId,
    competition,
    season: 2026,
    tournament: "clausura",
    goals: nonNegativeInteger(raw.goles ?? raw.goals),
    assists: nonNegativeInteger(raw.asistencias ?? raw.assists),
    appearances: nonNegativeInteger(raw.pj ?? raw.appearances),
    yellow_cards: nonNegativeInteger(raw.ta ?? raw.yellowCards),
    red_cards: nonNegativeInteger(raw.tr ?? raw.redCards),
  };
}

function targetMatch(id, raw, registry) {
  const competition = competitionFrom(raw, "isCup");
  const categoryId = compactText(raw.category ?? raw.categoria);
  const roundLabel = compactText(raw.fecha ?? raw.roundLabel);
  const roundFromLabel = Number(roundLabel.match(/\d+/)?.[0]);
  const parsedRound = Number(raw.round ?? roundFromLabel);
  const round = Number.isInteger(parsedRound) && parsedRound >= 1 ? parsedRound : competition === "cup" ? 99 : null;
  const homeClubId = registry.ensure(raw.local ?? raw.home, competition);
  const awayClubId = registry.ensure(raw.visita ?? raw.away, competition);
  const rawStatus = compactText(raw.status);
  const status = rawStatus === "played" ? "played" : rawStatus === "postponed" || rawStatus === "cancelled" ? rawStatus : "scheduled";
  if (!id || !CATEGORY_IDS.has(categoryId) || !round || homeClubId === awayClubId) throw new Error(`Partido inválido: ${id || "sin-id"} / ${categoryId || "sin-categoria"}`);
  return {
    id,
    season: 2026,
    tournament: "clausura",
    competition,
    category_id: categoryId,
    round,
    round_label: round === 99 ? roundLabel || "Por definir" : null,
    sort_order: nonNegativeInteger(raw.orden ?? raw.order) || 99,
    home_club_id: homeClubId,
    away_club_id: awayClubId,
    home_score: status === "played" ? nonNegativeInteger(raw.golesL ?? raw.homeScore) : null,
    away_score: status === "played" ? nonNegativeInteger(raw.golesV ?? raw.awayScore) : null,
    status,
    match_date: nullableText(raw.fechaCompleta ?? raw.date),
    match_time: nullableText(raw.hora ?? raw.time),
    venue: nullableText(raw.cancha ?? raw.venue),
  };
}

function targetPhoto(id, raw, registry) {
  const competition = compactText(raw.competition);
  const categoryId = compactText(raw.category);
  const url = compactText(raw.url);
  const storagePath = compactText(raw.storagePath);
  if (!id || !["league", "cup", "lff"].includes(competition) || !CATEGORY_IDS.has(categoryId) || !url || !storagePath) throw new Error(`Foto inválida: ${id || "sin-id"}`);
  return {
    id,
    competition,
    category_id: categoryId,
    club_id: registry.ensure(raw.club, competition),
    url,
    storage_path: storagePath,
    sort_order: nonNegativeInteger(raw.order),
  };
}

function assertUniqueIds(rows, label) {
  const ids = rows.map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error(`${label}: IDs duplicados después del merge.`);
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const localFixtures = await readJson("src/data/league-fixtures.json");
const localPlayers = await readJson("src/data/legacy-players.json");
const localMatches = [...localFixtures, ...buildLffFixtures()];
const [livePlayers, liveMatches, livePhotos] = await Promise.all([
  listFirestoreCollection("jugadores"),
  listFirestoreCollection("partidos"),
  listFirestoreCollection("teamPhotos"),
]);

const mergedPlayers = mergeById(localPlayers, livePlayers);
const mergedMatches = mergeById(localMatches, liveMatches);
const mergedPhotos = mergeById(SEEDED_TEAM_PHOTOS, livePhotos);

const registry = createClubRegistry();
scanAndRegisterClubs(registry, mergedPlayers, mergedMatches, mergedPhotos);

const players = mergedPlayers.map((row) => targetPlayer(String(row.id), row, registry));
const matches = mergedMatches.map((row) => targetMatch(String(row.id), row, registry));
const teamPhotos = mergedPhotos.map((row) => targetPhoto(String(row.id), row, registry));
assertUniqueIds(players, "players");
assertUniqueIds(matches, "matches");
assertUniqueIds(teamPhotos, "team_photos");

const clubs = [...registry.rows.values()].sort((a, b) => a.id.localeCompare(b.id));
const clubCompetitions = [...registry.competitions.values()].sort((a, b) => `${a.club_id}|${a.competition}`.localeCompare(`${b.club_id}|${b.competition}`));
const discoveredClubs = clubs.filter((club) => ![...LEAGUE_CLUBS, ...LFF_CLUBS].some((base) => base.id === club.id));

const exportData = {
  generatedAt: new Date().toISOString(),
  source: {
    precedence: "Firestore > local fallback by id",
    firestore: { players: livePlayers.length, matches: liveMatches.length, teamPhotos: livePhotos.length },
    local: { players: localPlayers.length, matches: localMatches.length, teamPhotos: SEEDED_TEAM_PHOTOS.length },
    merged: { players: players.length, matches: matches.length, teamPhotos: teamPhotos.length },
  },
  discoveredClubs,
  categories: CATEGORY_ROWS,
  clubs,
  clubCompetitions,
  players,
  matches,
  teamPhotos,
  appSettings: [
    { key: "season", value: 2026 },
    { key: "active_tournament", value: "clausura" },
  ],
};

const directory = resolve(ROOT, ".migration-backups");
await mkdir(directory, { recursive: true });
const timestamp = exportData.generatedAt.replace(/[:.]/g, "-");
const path = resolve(directory, `lifi-supabase-export-${timestamp}.json`);
await writeFile(path, `${JSON.stringify(exportData, null, 2)}\n`, "utf8");

console.log("Export normalizado listo; no se escribió nada en Supabase.");
console.log(JSON.stringify({
  firestore: exportData.source.firestore,
  local: exportData.source.local,
  merged: exportData.source.merged,
  categories: exportData.categories.length,
  clubs: exportData.clubs.length,
  clubCompetitions: exportData.clubCompetitions.length,
  discoveredClubs: exportData.discoveredClubs.map((club) => ({ id: club.id, name: club.name })),
  path,
  sha256: digest(exportData),
}, null, 2));
