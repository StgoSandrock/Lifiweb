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
  updateDoc,
} from "firebase/firestore";
import { firebaseArtifactId, firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { matchInputSchema, playerInputSchema } from "@/lib/validation";
import type { Match, Player } from "@/types/domain";

function dataCollection(name: "jugadores" | "partidos") {
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
  await updateDoc(doc(dataCollection("partidos"), parsed.id), {
    tournament: "clausura",
    isCup: input.competition === "cup",
    category: parsed.category,
    fecha: `Fecha ${parsed.round}`,
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
  });
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
