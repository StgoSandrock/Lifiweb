import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseArtifactId, firebaseAuth, firebaseDb, firebaseStorage } from "@/lib/firebase/client";
import { matchInputSchema, playerInputSchema } from "@/lib/validation";
import { assertCurrentVersion, scoreFromGoalEvents } from "@/lib/goal-events";
import type { CategoryId, Competition, GoalEvent, Match, Player, TeamPhoto, TeamRegistration } from "@/types/domain";

function dataCollection(name: "jugadores" | "partidos" | "teamPhotos" | "teams") {
  return collection(firebaseDb, "artifacts", firebaseArtifactId, "public", "data", name);
}

export async function isStaffUser(user: User | null) {
  if (!user || user.isAnonymous) return false;
  const token = await user.getIdTokenResult(true);
  if (token.claims.staff === true || token.claims.admin === true) return true;
  const role = await getDoc(doc(firebaseDb, "staffRoles", user.uid));
  return role.exists() && role.data().active === true;
}

export async function signInStaff(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  if (!(await isStaffUser(credential.user))) {
    await signOut(firebaseAuth);
    throw new Error("La cuenta inició sesión, pero no posee el rol Staff.");
  }
  return credential.user;
}

export const signOutStaff = () => signOut(firebaseAuth);
export const observeStaffUser = (callback: (user: User | null) => void) => onIdTokenChanged(firebaseAuth, callback);

export async function saveMatch(input: Match, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  const parsed = matchInputSchema.parse(input);
  await setDoc(doc(dataCollection("partidos"), parsed.id), {
    tournament: "clausura",
    isCup: input.competition === "cup",
    competition: input.competition,
    category: parsed.category,
    fecha: input.roundLabel ?? `Fecha ${parsed.round}`,
    round: parsed.round,
    orden: Number.isInteger(input.order) && input.order >= 0 ? input.order : 99,
    local: parsed.home,
    visita: parsed.away,
    status: parsed.status === "played" ? "played" : parsed.status === "scheduled" ? "pending" : parsed.status,
    fechaCompleta: parsed.date ?? "",
    hora: parsed.time ?? "Por definir",
    cancha: parsed.venue ?? "Por definir",
    golesL: parsed.homeScore,
    golesV: parsed.awayScore,
    penalesL: parsed.homePenalties,
    penalesV: parsed.awayPenalties,
    goalEvents: input.goalEvents ?? [],
    version: input.version ?? 0,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  }, { merge: true });
}

export class MatchConflictError extends Error {
  constructor() {
    super("Este partido fue modificado desde otro dispositivo. Recarga la información antes de continuar.");
    this.name = "MatchConflictError";
  }
}

export async function saveMatchResult(input: { match: Match; goalEvents: GoalEvent[]; status: "played" | "scheduled" }, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  const { home, away } = scoreFromGoalEvents(input.goalEvents);
  if (home > 99 || away > 99) throw new Error("El marcador no puede superar 99 goles por equipo.");
  const matchRef = doc(dataCollection("partidos"), input.match.id);
  const auditRef = doc(collection(firebaseDb, "artifacts", firebaseArtifactId, "private", "data", "matchAudits"));
  try {
    await runTransaction(firebaseDb, async (transaction) => {
      const snapshot = await transaction.get(matchRef);
      if (!snapshot.exists()) throw new Error("El partido ya no existe.");
      const current = snapshot.data();
      const currentVersion = Number.isInteger(current.version) ? Number(current.version) : 0;
      assertCurrentVersion(currentVersion, input.match.version ?? 0);
      const previousHome = Number.isInteger(current.golesL) ? Number(current.golesL) : null;
      const previousAway = Number.isInteger(current.golesV) ? Number(current.golesV) : null;
      const status = input.status === "played" ? "played" : "pending";
      transaction.update(matchRef, {
        status,
        golesL: status === "played" ? home : null,
        golesV: status === "played" ? away : null,
        goalEvents: status === "played" ? input.goalEvents : [],
        version: currentVersion + 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      transaction.set(auditRef, {
        matchId: input.match.id,
        competition: input.match.competition,
        category: input.match.category,
        home: input.match.home,
        away: input.match.away,
        previous: { homeScore: previousHome, awayScore: previousAway, status: String(current.status ?? "pending"), version: currentVersion },
        next: { homeScore: status === "played" ? home : null, awayScore: status === "played" ? away : null, status, version: currentVersion + 1 },
        goalEvents: status === "played" ? input.goalEvents : [],
        action: "result-updated",
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email ?? "",
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MATCH_CONFLICT") throw new MatchConflictError();
    throw error;
  }
}
export async function deleteMatch(matchId: string, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  await deleteDoc(doc(dataCollection("partidos"), matchId));
}

export async function saveTeam(input: Omit<TeamRegistration, "id"> & { id?: string }, user: User, logoFile?: File | null) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) throw new Error("El nombre del equipo debe tener entre 2 y 80 caracteres.");
  const id = input.id || `${input.competition}-${input.category}-${safeSegment(name)}-${crypto.randomUUID().slice(0, 8)}`;
  let logo = input.logo || "";
  let logoStoragePath = "";
  if (logoFile) {
    if (!logoFile.type.startsWith("image/") || logoFile.size > 5 * 1024 * 1024) throw new Error("El escudo debe ser una imagen de hasta 5 MB.");
    const extension = logoFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    logoStoragePath = `team-logos/${input.competition}/${input.category}/${id}.${extension}`;
    const logoRef = ref(firebaseStorage, logoStoragePath);
    await uploadBytes(logoRef, logoFile, { contentType: logoFile.type });
    logo = await getDownloadURL(logoRef);
  }
  await setDoc(doc(dataCollection("teams"), id), {
    name,
    aliases: input.aliases ?? [],
    logo,
    logoStoragePath,
    competition: input.competition,
    category: input.category,
    active: input.active,
    order: input.order,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    ...(input.id ? {} : { createdAt: serverTimestamp(), createdBy: user.uid }),
  }, { merge: true });
  return id;
}

export async function deleteTeam(team: TeamRegistration, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  const snapshot = await getDoc(doc(dataCollection("teams"), team.id));
  const storagePath = snapshot.exists() ? String(snapshot.data().logoStoragePath || "") : "";
  if (storagePath) await deleteObject(ref(firebaseStorage, storagePath)).catch(() => undefined);
  await deleteDoc(doc(dataCollection("teams"), team.id));
}
export async function savePlayer(input: Omit<Player, "id"> & { id?: string }, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  const parsed = playerInputSchema.parse(input);
  const payload = {
    nombre: parsed.name,
    posicion: parsed.position,
    club: parsed.club,
    categoria: parsed.category,
    cupPlayer: parsed.competition === "cup",
    competition: parsed.competition,
    goles: parsed.goals,
    asistencias: parsed.assists,
    pj: parsed.appearances,
    ta: parsed.yellowCards,
    tr: parsed.redCards,
    tournament: "clausura",
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  };
  if (parsed.id) await updateDoc(doc(dataCollection("jugadores"), parsed.id), payload);
  else await addDoc(dataCollection("jugadores"), { ...payload, createdAt: serverTimestamp(), createdBy: user.uid });
}

export async function deletePlayer(playerId: string, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  await deleteDoc(doc(dataCollection("jugadores"), playerId));
}

function safeSegment(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadTeamPhotos(input: { files: File[]; competition: Competition; category: CategoryId; club: string }, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  if (!input.files.length) throw new Error("Selecciona al menos una foto.");
  const invalid = input.files.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);
  if (invalid) throw new Error("Cada archivo debe ser una imagen de hasta 10 MB.");
  const uploaded: TeamPhoto[] = [];
  for (const [index, file] of input.files.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const id = crypto.randomUUID();
    const storagePath = `team-galleries/${input.competition}/${input.category}/${safeSegment(input.club)}/${id}.${extension}`;
    const storageRef = ref(firebaseStorage, storagePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    const photo = { id, competition: input.competition, category: input.category, club: input.club, url, storagePath, order: Date.now() + index };
    await setDoc(doc(dataCollection("teamPhotos"), id), { ...photo, createdAt: serverTimestamp(), createdBy: user.uid });
    uploaded.push(photo);
  }
  return uploaded;
}

export async function deleteTeamPhoto(photo: TeamPhoto, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  await deleteObject(ref(firebaseStorage, photo.storagePath));
  await deleteDoc(doc(dataCollection("teamPhotos"), photo.id));
}
