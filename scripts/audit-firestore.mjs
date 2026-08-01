const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBLGMtJ6QJSNwakmD_PdgtstARICyu1sEI";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "lifiwebapp";
const appId = process.env.NEXT_PUBLIC_FIREBASE_ARTIFACT_ID ?? "lifi-2026-prod";
if (!apiKey || !projectId || !appId) throw new Error("Configuración pública de Firebase incompleta");

const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ returnSecureToken: true }),
});
if (!authResponse.ok) throw new Error(`Firebase Auth ${authResponse.status}: ${await authResponse.text()}`);
const { idToken } = await authResponse.json();

function decode(field) {
  if (!field || typeof field !== "object") return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return Number(field.doubleValue);
  if ("booleanValue" in field) return field.booleanValue;
  if ("timestampValue" in field) return field.timestampValue;
  if ("nullValue" in field) return null;
  if ("arrayValue" in field) return (field.arrayValue.values ?? []).map(decode);
  if ("mapValue" in field) return decodeFields(field.mapValue.fields ?? {});
  return undefined;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, decode(field)]));
}

async function listCollection(collection, token = idToken) {
  const documents = [];
  let pageToken;
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/${appId}/public/data/${collection}`);
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error(`Firestore ${collection} ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    documents.push(...(payload.documents ?? []).map((document) => ({
      id: document.name.split("/").at(-1),
      ...decodeFields(document.fields ?? {}),
    })));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return documents;
}

const [players, fixtures] = await Promise.all([listCollection("jugadores"), listCollection("partidos")]);
let unauthenticatedRead = false;
try {
  await listCollection("partidos", null);
  unauthenticatedRead = true;
} catch {
  unauthenticatedRead = false;
}
const fold = (input = "") => String(input).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const group = (items, key) => items.reduce((result, item) => {
  const label = key(item);
  result[label] = (result[label] ?? 0) + 1;
  return result;
}, {});
const duplicatePlayers = new Map();
for (const player of players) {
  const key = [fold(player.nombre), fold(player.club), player.categoria, Boolean(player.cupPlayer)].join("|");
  duplicatePlayers.set(key, (duplicatePlayers.get(key) ?? 0) + 1);
}
const duplicateFixtures = new Map();
for (const fixture of fixtures) {
  const teams = [fold(fixture.local), fold(fixture.visita)].sort();
  const key = [fixture.tournament, Boolean(fixture.isCup), fixture.category, fixture.fecha, ...teams].join("|");
  duplicateFixtures.set(key, (duplicateFixtures.get(key) ?? 0) + 1);
}

console.log(JSON.stringify({
  auth: { anonymousRead: true, unauthenticatedRead },
  players: {
    total: players.length,
    byClubCategory: Object.fromEntries(Object.entries(group(players, (p) => `${p.club ?? "(sin club)"} / ${p.categoria ?? "(sin categoría)"}${p.cupPlayer ? " / Cup" : ""}`)).sort()),
    duplicates: [...duplicatePlayers.values()].filter((count) => count > 1).length,
    withStats: players.filter((player) => ["goles", "asistencias", "pj", "ta", "tr"].some((field) => Number(player[field]) > 0)).length,
    legacyClubNames: group(players.filter((player) => ["uc chicureo", "newen"].includes(fold(player.club))), (player) => player.club),
  },
  fixtures: {
    total: fixtures.length,
    leagueClausura: fixtures.filter((fixture) => fixture.tournament === "clausura" && fixture.isCup !== true).length,
    cup: fixtures.filter((fixture) => fixture.isCup === true).length,
    byCategoryRound: Object.fromEntries(Object.entries(group(fixtures.filter((fixture) => fixture.tournament === "clausura" && fixture.isCup !== true), (fixture) => `${fixture.category ?? "(sin categoría)"} / ${fixture.fecha ?? "(sin fecha)"}`)).sort()),
    duplicates: [...duplicateFixtures.values()].filter((count) => count > 1).length,
    played: fixtures.filter((fixture) => fixture.status === "played").length,
    pending: fixtures.filter((fixture) => fixture.status !== "played").length,
    legacyClubReferences: fixtures.filter((fixture) => [fixture.local, fixture.visita].some((club) => ["uc chicureo", "newen"].includes(fold(club)))).length,
    aperture: fixtures.filter((fixture) => fold(fixture.tournament) === "apertura").length,
  },
}, null, 2));
