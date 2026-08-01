import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { firebaseArtifactId, firebaseDb } from "@/lib/firebase/client";
import { fromFirestoreMatch, fromFirestorePlayer } from "@/lib/firebase/adapters";
import type { Match, Player } from "@/types/domain";

function publicCollection(name: "jugadores" | "partidos") {
  return collection(firebaseDb, "artifacts", firebaseArtifactId, "public", "data", name);
}

export function subscribeToLeagueData(callbacks: {
  matches: (matches: Match[]) => void;
  players: (players: Player[]) => void;
  error: (error: Error) => void;
}): Unsubscribe {
  const unsubscribeMatches = onSnapshot(publicCollection("partidos"), (snapshot) => {
    callbacks.matches(snapshot.docs.flatMap((item) => {
      const match = fromFirestoreMatch(item.id, item.data());
      return match ? [match] : [];
    }));
  }, callbacks.error);
  const unsubscribePlayers = onSnapshot(publicCollection("jugadores"), (snapshot) => {
    callbacks.players(snapshot.docs.flatMap((item) => {
      const player = fromFirestorePlayer(item.id, item.data());
      return player ? [player] : [];
    }));
  }, callbacks.error);
  return () => {
    unsubscribeMatches();
    unsubscribePlayers();
  };
}
