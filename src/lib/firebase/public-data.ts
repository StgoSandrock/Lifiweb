import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { firebaseArtifactId, firebaseDb } from "@/lib/firebase/client";
import { fromFirestoreMatch, fromFirestorePlayer, fromFirestoreTeam, fromFirestoreTeamPhoto } from "@/lib/firebase/adapters";
import type { Match, Player, TeamPhoto, TeamRegistration } from "@/types/domain";

function publicCollection(name: "jugadores" | "partidos" | "teamPhotos" | "teams") {
  return collection(firebaseDb, "artifacts", firebaseArtifactId, "public", "data", name);
}

export function subscribeToLeagueData(callbacks: {
  matches: (matches: Match[], deletedIds?: string[], deletedMatches?: Match[]) => void;
  players: (players: Player[], deletedIds?: string[], deletedPlayers?: Player[]) => void;
  photos: (photos: TeamPhoto[]) => void;
  teams: (teams: TeamRegistration[]) => void;
  error: (error: Error) => void;
}): Unsubscribe {
  const unsubscribeMatches = onSnapshot(publicCollection("partidos"), (snapshot) => {
    callbacks.matches(snapshot.docs.flatMap((item) => {
      if (item.data().deleted === true) return [];
      const match = fromFirestoreMatch(item.id, item.data());
      return match ? [match] : [];
    }), snapshot.docs.filter(item => item.data().deleted === true).map(item => item.id), snapshot.docs.filter(item => item.data().deleted === true).flatMap(item => { const m=fromFirestoreMatch(item.id,item.data());return m?[m]:[]; }));
  }, callbacks.error);
  const unsubscribePlayers = onSnapshot(publicCollection("jugadores"), (snapshot) => {
    callbacks.players(snapshot.docs.flatMap((item) => {
      if (item.data().deleted === true) return [];
      const player = fromFirestorePlayer(item.id, item.data());
      return player ? [player] : [];
    }), snapshot.docs.filter(item => item.data().deleted === true).map(item => item.id), snapshot.docs.filter(item => item.data().deleted === true).flatMap(item => { const p = fromFirestorePlayer(item.id,item.data()); return p ? [p] : []; }));
  }, callbacks.error);
  const unsubscribePhotos = onSnapshot(publicCollection("teamPhotos"), (snapshot) => {
    callbacks.photos(snapshot.docs.flatMap((item) => {
      const photo = fromFirestoreTeamPhoto(item.id, item.data());
      return photo ? [photo] : [];
    }));
  }, callbacks.error);
  const unsubscribeTeams = onSnapshot(publicCollection("teams"), (snapshot) => {
    callbacks.teams(snapshot.docs.flatMap((item) => {
      const team = fromFirestoreTeam(item.id, item.data());
      return team ? [team] : [];
    }));
  }, callbacks.error);
  return () => {
    unsubscribeMatches();
    unsubscribePlayers();
    unsubscribePhotos();
    unsubscribeTeams();
  };
}
