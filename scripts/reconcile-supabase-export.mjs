import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const BACKUPS = resolve(ROOT, ".migration-backups");

function normalizeKey(value) {
  return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function latest(prefix) {
  const files = (await readdir(BACKUPS)).filter((name) => name.startsWith(prefix) && name.endsWith(".json")).sort();
  if (!files.length) throw new Error(`No existe archivo ${prefix}*.json en .migration-backups.`);
  return resolve(BACKUPS, files.at(-1));
}

function firestoreIds(snapshot, collection) {
  return new Set((snapshot.documents?.[collection] ?? []).map((document) => String(document.name).split("/").pop()));
}

function playerSemanticKey(player) {
  return [normalizeKey(player.name), player.club_id, player.category_id, player.competition].join("|");
}

function matchSemanticKey(match) {
  return [match.competition, match.category_id, match.round, match.home_club_id, match.away_club_id].join("|");
}

function reconcilePlayers(rows, liveIds) {
  const live = rows.filter((row) => liveIds.has(row.id));
  const localOnly = rows.filter((row) => !liveIds.has(row.id));
  const liveBySemanticKey = new Map();
  for (const row of live) {
    const key = playerSemanticKey(row);
    if (!liveBySemanticKey.has(key)) liveBySemanticKey.set(key, row);
  }

  const aliases = [];
  const retainedLocal = [];
  for (const row of localOnly) {
    const canonical = liveBySemanticKey.get(playerSemanticKey(row));
    if (canonical) {
      aliases.push({ entity_type: "player", legacy_id: row.id, canonical_id: canonical.id, reason: "local_fallback_semantic_duplicate" });
    } else {
      retainedLocal.push(row);
    }
  }
  return { rows: [...live, ...retainedLocal], aliases, retainedLocalCount: retainedLocal.length };
}

function reconcileMatches(rows, liveIds) {
  const localCanonicalLeague = rows.filter((row) => !liveIds.has(row.id) && row.competition === "league" && row.id.startsWith("clausura-"));
  const canonicalBySemanticKey = new Map(localCanonicalLeague.map((row) => [matchSemanticKey(row), row]));
  const live = rows.filter((row) => liveIds.has(row.id));
  const nonLiveNonCanonical = rows.filter((row) => !liveIds.has(row.id) && !(row.competition === "league" && row.id.startsWith("clausura-")));

  const liveLeagueKeys = new Set();
  const aliases = [];
  const unmatchedLiveLeague = [];
  const mergedCanonicalById = new Map(localCanonicalLeague.map((row) => [row.id, row]));
  const liveNonLeague = [];

  for (const liveRow of live) {
    if (liveRow.competition !== "league") {
      liveNonLeague.push(liveRow);
      continue;
    }
    const key = matchSemanticKey(liveRow);
    liveLeagueKeys.add(key);
    const canonical = canonicalBySemanticKey.get(key);
    if (!canonical) {
      unmatchedLiveLeague.push(liveRow);
      continue;
    }
    mergedCanonicalById.set(canonical.id, { ...canonical, ...liveRow, id: canonical.id, tournament: "clausura" });
    if (liveRow.id !== canonical.id) {
      aliases.push({ entity_type: "match", legacy_id: liveRow.id, canonical_id: canonical.id, reason: "firebase_legacy_match_id" });
    }
  }

  const uncoveredCanonical = localCanonicalLeague.filter((row) => !liveLeagueKeys.has(matchSemanticKey(row)));
  const canonicalLeague = [...mergedCanonicalById.values()];

  const otherById = new Map(nonLiveNonCanonical.map((row) => [row.id, row]));
  for (const row of liveNonLeague) otherById.set(row.id, row);
  for (const row of unmatchedLiveLeague) otherById.set(row.id, row);

  return {
    rows: [...canonicalLeague, ...otherById.values()],
    aliases,
    canonicalLeagueCount: canonicalLeague.length,
    uncoveredCanonicalCount: uncoveredCanonical.length,
    unmatchedLiveLeagueCount: unmatchedLiveLeague.length,
  };
}

await mkdir(BACKUPS, { recursive: true });
const rawPath = await latest("firestore-raw-");
const normalizedPath = await latest("lifi-supabase-export-");
const raw = JSON.parse(await readFile(rawPath, "utf8"));
const normalized = JSON.parse(await readFile(normalizedPath, "utf8"));

const playerLiveIds = firestoreIds(raw, "jugadores");
const matchLiveIds = firestoreIds(raw, "partidos");
const playerResult = reconcilePlayers(normalized.players, playerLiveIds);
const matchResult = reconcileMatches(normalized.matches, matchLiveIds);

if (matchResult.canonicalLeagueCount !== 225) {
  throw new Error(`Se esperaban 225 partidos canónicos de liga y resultaron ${matchResult.canonicalLeagueCount}.`);
}
if (matchResult.unmatchedLiveLeagueCount !== 0) {
  throw new Error(`Hay ${matchResult.unmatchedLiveLeagueCount} partidos vivos de liga sin correspondencia canónica; no se continuará.`);
}

const aliases = [...playerResult.aliases, ...matchResult.aliases];
const output = {
  ...normalized,
  generatedAt: new Date().toISOString(),
  reconciliation: {
    strategy: "Firestore current values win; duplicate legacy/local IDs are mapped to one canonical active record",
    rawSnapshot: rawPath.split("/").pop(),
    normalizedSnapshot: normalizedPath.split("/").pop(),
    playersBefore: normalized.players.length,
    playersAfter: playerResult.rows.length,
    playersLocalUniqueRetained: playerResult.retainedLocalCount,
    playerAliases: playerResult.aliases.length,
    matchesBefore: normalized.matches.length,
    matchesAfter: matchResult.rows.length,
    matchAliases: matchResult.aliases.length,
    canonicalLeagueMatches: matchResult.canonicalLeagueCount,
    uncoveredCanonicalLeagueMatches: matchResult.uncoveredCanonicalCount,
    unmatchedLiveLeagueMatches: matchResult.unmatchedLiveLeagueCount,
  },
  players: playerResult.rows,
  matches: matchResult.rows,
  migrationAliases: aliases,
};

const timestamp = output.generatedAt.replace(/[:.]/g, "-");
const path = resolve(BACKUPS, `lifi-supabase-canonical-${timestamp}.json`);
await writeFile(path, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log("Reconciliación canónica lista; no se escribió nada en Supabase.");
console.log(JSON.stringify({
  reconciliation: output.reconciliation,
  categories: output.categories.length,
  clubs: output.clubs.length,
  clubCompetitions: output.clubCompetitions.length,
  players: output.players.length,
  matches: output.matches.length,
  teamPhotos: output.teamPhotos.length,
  migrationAliases: output.migrationAliases.length,
  path,
  sha256: digest(output),
}, null, 2));
