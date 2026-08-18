import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const artifactId = process.env.NEXT_PUBLIC_FIREBASE_ARTIFACT_ID;

if (!apiKey || !projectId || !artifactId) {
  throw new Error("Faltan variables públicas de Firebase para exportar Firestore.");
}

async function listCollection(collectionName) {
  const rows = [];
  let pageToken = "";
  do {
    const path = `artifacts/${artifactId}/public/data/${collectionName}`;
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`);
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Firestore ${collectionName}: HTTP ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    for (const document of payload.documents ?? []) {
      rows.push(document);
    }
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken);
  return rows;
}

const generatedAt = new Date().toISOString();
const [jugadores, partidos, teamPhotos] = await Promise.all([
  listCollection("jugadores"),
  listCollection("partidos"),
  listCollection("teamPhotos"),
]);

const snapshot = {
  generatedAt,
  source: {
    projectId,
    artifactId,
    database: "(default)",
    paths: {
      jugadores: `artifacts/${artifactId}/public/data/jugadores`,
      partidos: `artifacts/${artifactId}/public/data/partidos`,
      teamPhotos: `artifacts/${artifactId}/public/data/teamPhotos`,
    },
  },
  counts: {
    jugadores: jugadores.length,
    partidos: partidos.length,
    teamPhotos: teamPhotos.length,
  },
  documents: { jugadores, partidos, teamPhotos },
};

const body = JSON.stringify(snapshot, null, 2);
const sha256 = createHash("sha256").update(body).digest("hex");
const directory = resolve(process.cwd(), ".migration-backups");
await mkdir(directory, { recursive: true });
const timestamp = generatedAt.replace(/[:.]/g, "-");
const path = resolve(directory, `firestore-raw-${timestamp}.json`);
await writeFile(path, `${body}\n`, "utf8");

console.log("Snapshot crudo de Firestore creado.");
console.log(JSON.stringify({ ...snapshot.counts, path, sha256 }, null, 2));
