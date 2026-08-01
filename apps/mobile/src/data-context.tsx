import fallbackFixtures from "@shared/data/league-fixtures.json";
import fallbackPlayers from "@shared/data/legacy-players.json";
import { fromFirestoreMatch, fromFirestorePlayer } from "@shared/lib/firebase/adapters";
import type { Match, Player } from "@shared/types/domain";
import { collection, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { firebaseArtifactId, firebaseDb } from "./services/firebase";

type DataStatus = "loading" | "live" | "fallback";
type LeagueData = {
  matches: Match[];
  players: Player[];
  status: DataStatus;
  error: string | null;
};

const fallbackPlayerData = fallbackPlayers.flatMap((player, index) => {
  const mapped = fromFirestorePlayer(String(player.id ?? `fallback-${index}`), player);
  return mapped ? [mapped] : [];
});

const LeagueDataContext = createContext<LeagueData | null>(null);

export function LeagueDataProvider({ children }: PropsWithChildren) {
  const [matches, setMatches] = useState<Match[]>(fallbackFixtures as Match[]);
  const [players, setPlayers] = useState<Player[]>(fallbackPlayerData);
  const [status, setStatus] = useState<DataStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fail = () => {
      setStatus("fallback");
      setError("No pudimos conectar con Firebase. Mostramos el último respaldo disponible.");
    };
    const unsubscribeMatches = onSnapshot(
      collection(firebaseDb, "artifacts", firebaseArtifactId, "public", "data", "partidos"),
      (snapshot) => {
        setMatches(snapshot.docs.flatMap((item) => {
          const match = fromFirestoreMatch(item.id, item.data());
          return match ? [match] : [];
        }));
        setStatus("live");
        setError(null);
      },
      fail,
    );
    const unsubscribePlayers = onSnapshot(
      collection(firebaseDb, "artifacts", firebaseArtifactId, "public", "data", "jugadores"),
      (snapshot) => {
        setPlayers(snapshot.docs.flatMap((item) => {
          const player = fromFirestorePlayer(item.id, item.data());
          return player ? [player] : [];
        }));
        setStatus("live");
        setError(null);
      },
      fail,
    );
    return () => {
      unsubscribeMatches();
      unsubscribePlayers();
    };
  }, []);

  const value = useMemo(() => ({ matches, players, status, error }), [matches, players, status, error]);
  return <LeagueDataContext.Provider value={value}>{children}</LeagueDataContext.Provider>;
}

export function useLeagueData() {
  const value = useContext(LeagueDataContext);
  if (!value) throw new Error("useLeagueData debe usarse dentro de LeagueDataProvider");
  return value;
}
