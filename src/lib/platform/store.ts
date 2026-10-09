import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import {
  organizationSchema,
  seasonSchema,
  tournamentSchema,
  teamSchema,
  fixtureSchema,
  playerSchema,
  type Archive,
  type Member,
  type Organization,
} from "./model";

export type EntityKind =
  "seasons" | "tournaments" | "teams" | "matches" | "players";
export function entityPath(org: string, kind: EntityKind, tournament?: string) {
  return tournament
    ? `organizations/${org}/tournaments/${tournament}/${kind}`
    : `organizations/${org}/${kind}`;
}
export function watch<T>(
  path: string,
  next: (rows: T[]) => void,
  error: (error: Error) => void,
  publicOnly = false,
  teamId?: string,
) {
  const source = path.endsWith("/audits")
    ? query(collection(firebaseDb, path), orderBy("at", "desc"), limit(100))
    : teamId
      ? query(collection(firebaseDb, path), where("teamId", "==", teamId))
      : publicOnly
        ? query(collection(firebaseDb, path), where("published", "==", true))
        : collection(firebaseDb, path);
  return onSnapshot(
    source,
    (snapshot) =>
      next(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as T)),
    error,
  );
}
export async function organization(org: string) {
  const d = await getDoc(doc(firebaseDb, "organizations", org));
  return d.exists() ? (d.data() as Organization) : null;
}
export async function membership(org: string): Promise<Member | null> {
  const user = firebaseAuth.currentUser;
  if (!user?.email || !user.emailVerified) return null;
  const d = await getDoc(
    doc(firebaseDb, "organizations", org, "members", user.email.toLowerCase()),
  );
  return d.exists() ? (d.data() as Member) : null;
}
export async function createOrganization(input: Organization) {
  const data = organizationSchema.parse(input),
    user = firebaseAuth.currentUser;
  if (!user?.email || !user.emailVerified)
    throw new Error("Verifica tu correo antes de continuar.");
  const ref = doc(firebaseDb, "organizations", data.id);
  await runTransaction(firebaseDb, async (tx) => {
    if ((await tx.get(ref)).exists())
      throw new Error("Ese identificador ya está ocupado.");
    tx.set(ref, { ...data, ownerUid: user.uid, createdAt: serverTimestamp() });
    tx.set(doc(ref, "members", user.email!.toLowerCase()), {
      email: user.email!.toLowerCase(),
      role: "admin",
      teamId: "",
      active: true,
    });
  });
}
export async function updateOrganization(input: Organization) {
  const data = organizationSchema.parse(input);
  await updateDoc(doc(firebaseDb, "organizations", data.id), {
    name: data.name,
    color: data.color,
    contactEmail: data.contactEmail,
    logoUrl: data.logoUrl ?? "",
  });
}
export async function saveEntity(
  org: string,
  kind: EntityKind,
  input: unknown,
  expectedVersion: number | null,
  tournament?: string,
) {
  const schema = {
    seasons: seasonSchema,
    tournaments: tournamentSchema,
    teams: teamSchema,
    matches: fixtureSchema,
    players: playerSchema,
  }[kind];
  const data = schema.parse(input),
    user = firebaseAuth.currentUser;
  if (!user?.emailVerified) throw new Error("Necesitas una sesión verificada.");
  const ref = doc(firebaseDb, entityPath(org, kind, tournament), data.id);
  await runTransaction(firebaseDb, async (tx) => {
    const snapshot = await tx.get(ref);
    if (
      (snapshot.exists() ? snapshot.data().version : null) !== expectedVersion
    )
      throw new Error(
        "Otra persona cambió estos datos. Recarga antes de guardar.",
      );
    const version = expectedVersion === null ? 0 : expectedVersion + 1;
    const auditId = `${kind}-${tournament ?? "root"}-${data.id}-${version}`;
    const payload = {
      ...data,
      version,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
      auditId,
    };
    tx.set(ref, payload);
    tx.set(doc(firebaseDb, "organizations", org, "audits", auditId), {
      path: ref.path,
      action: "saved",
      version,
      actor: user.uid,
      at: serverTimestamp(),
      previous: snapshot.exists() ? snapshot.data() : null,
      next: payload,
    });
  });
}
export async function saveMember(org: string, member: Member) {
  const email = member.email.trim().toLowerCase();
  if (!/^[^/@\s]+@[^/@\s]+\.[^/@\s]+$/.test(email))
    throw new Error("Correo no válido.");
  if (email === firebaseAuth.currentUser?.email?.toLowerCase())
    throw new Error("No puedes modificar tu propio acceso.");
  const ref = doc(firebaseDb, "organizations", org, "members", email);
  await runTransaction(firebaseDb, async (tx) => {
    await tx.get(ref);
    tx.set(ref, { ...member, email });
  });
}
export async function importArchive(org: string, archive: Archive) {
  const id = `import-${crypto.randomUUID()}`;
  const season = await getDoc(
    doc(firebaseDb, entityPath(org, "seasons"), archive.tournament.seasonId),
  );
  if (!season.exists())
    throw new Error("Crea primero la temporada del archivo.");
  if (season.data().archived === true)
    throw new Error("Reabre la temporada antes de importar.");
  await saveEntity(
    org,
    "tournaments",
    {
      ...archive.tournament,
      id,
      name: `${archive.tournament.name.slice(0, 75)} (importado)`,
      published: false,
    },
    null,
  );
  try {
    for (const kind of ["teams", "matches", "players"] as const)
      for (const row of archive[kind])
        await saveEntity(org, kind, row, null, id);
  } catch {
    throw new Error(
      `La importación quedó incompleta en ${id}. Permanece sin publicar. Revisa el borrador antes de usarlo; el torneo original no cambió.`,
    );
  }
  return id;
}
export async function getArchive(
  org: string,
  tournamentId: string,
): Promise<Archive> {
  const tournament = await getDoc(
    doc(firebaseDb, entityPath(org, "tournaments"), tournamentId),
  );
  const [teams, matches, players] = await Promise.all(
    ["teams", "matches", "players"].map((kind) =>
      getDocs(
        collection(
          firebaseDb,
          entityPath(org, kind as EntityKind, tournamentId),
        ),
      ),
    ),
  );
  return {
    format: "lifiweb-tournament",
    version: 1,
    organizationId: org,
    exportedAt: new Date().toISOString(),
    tournament: tournamentSchema.parse(tournament.data()),
    teams: teams.docs.map((d) => teamSchema.parse(d.data())),
    matches: matches.docs.map((d) => fixtureSchema.parse(d.data())),
    players: players.docs.map((d) => playerSchema.parse(d.data())),
  };
}
