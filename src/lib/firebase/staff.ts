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
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseArtifactId, firebaseAuth, firebaseDb, firebaseStorage } from "@/lib/firebase/client";
import { matchInputSchema, playerInputSchema } from "@/lib/validation";
import type { CategoryId, Competition, Match, Player, TeamPhoto } from "@/types/domain";

function dataCollection(name: "jugadores" | "partidos" | "teamPhotos") {
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
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  }, { merge: true });
}

export async function deleteMatch(matchId: string, user: User) {
  if (!(await isStaffUser(user))) throw new Error("Sesión Staff no autorizada.");
  await deleteDoc(doc(dataCollection("partidos"), matchId));
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
