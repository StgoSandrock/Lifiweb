import type { CategoryId, Competition, Match, MatchStatus, Player, TeamPhoto } from "../../types/domain";
import { CATEGORY_IDS } from "../../config/league";
import { normalizeClubName } from "../text";

type Raw = Record<string, unknown>;

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const nonNegative = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
};
const nullableScore = (value: unknown, played: boolean) => {
  if (!played || value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};
const category = (value: unknown): CategoryId | null => CATEGORY_IDS.includes(value as CategoryId) ? value as CategoryId : null;
const nullableDetail = (value: unknown) => {
  const result = text(value);
  return result && result !== "Por definir" ? result : null;
};
const competition = (raw: Raw, legacyCupField: "isCup" | "cupPlayer"): Competition => {
  if (raw.competition === "lff" || raw.competition === "cup" || raw.competition === "league") return raw.competition;
  return raw[legacyCupField] === true ? "cup" : "league";
};

export function fromFirestoreMatch(id: string, raw: Raw): Match | null {
  const matchCategory = category(raw.category);
  const home = normalizeClubName(text(raw.local ?? raw.home));
  const away = normalizeClubName(text(raw.visita ?? raw.away));
  if (!matchCategory || !home || !away) return null;
  const played = raw.status === "played";
  const matchCompetition = competition(raw, "isCup");
  const roundText = text(raw.fecha);
  const roundMatch = roundText.match(/\d+/);
  const parsedRound = Number(raw.round ?? roundMatch?.[0]);
  const hasNumberedRound = Number.isInteger(parsedRound) && parsedRound >= 1;
  if (!hasNumberedRound && matchCompetition !== "cup") return null;
  const round = hasNumberedRound ? parsedRound : 99;
  const mappedStatus: MatchStatus = played
    ? "played"
    : raw.status === "postponed" || raw.status === "cancelled"
      ? raw.status
      : "scheduled";
  return {
    id,
    tournament: "clausura",
    competition: matchCompetition,
    category: matchCategory,
    round,
    roundLabel: hasNumberedRound ? undefined : roundText || "Por definir",
    order: nonNegative(raw.orden ?? raw.order) || 99,
    home,
    away,
    homeScore: nullableScore(raw.golesL ?? raw.homeScore, played),
    awayScore: nullableScore(raw.golesV ?? raw.awayScore, played),
    homePenalties: nullableScore(raw.penalesL ?? raw.homePenalties, played),
    awayPenalties: nullableScore(raw.penalesV ?? raw.awayPenalties, played),
    status: mappedStatus,
    date: nullableDetail(raw.fechaCompleta ?? raw.date),
    time: nullableDetail(raw.hora ?? raw.time),
    venue: nullableDetail(raw.cancha ?? raw.venue),
  };
}

export function fromFirestorePlayer(id: string, raw: Raw): Player | null {
  const playerCategory = category(raw.categoria ?? raw.category);
  const club = normalizeClubName(text(raw.club));
  const name = text(raw.nombre ?? raw.name);
  if (!playerCategory || !club || !name) return null;
  return {
    id,
    name,
    position: text(raw.posicion ?? raw.position) || "Jugador",
    club,
    category: playerCategory,
    competition: competition(raw, "cupPlayer"),
    goals: nonNegative(raw.goles ?? raw.goals),
    assists: nonNegative(raw.asistencias ?? raw.assists),
    appearances: nonNegative(raw.pj ?? raw.appearances),
    yellowCards: nonNegative(raw.ta ?? raw.yellowCards),
    redCards: nonNegative(raw.tr ?? raw.redCards),
  };
}

export function fromFirestoreTeamPhoto(id: string, raw: Raw): TeamPhoto | null {
  const photoCategory = category(raw.category);
  const photoCompetition = raw.competition;
  const club = text(raw.club);
  const url = text(raw.url);
  const storagePath = text(raw.storagePath);
  if (!photoCategory || (photoCompetition !== "league" && photoCompetition !== "cup" && photoCompetition !== "lff") || !club || !url || !storagePath) return null;
  return { id, category: photoCategory, competition: photoCompetition, club, url, storagePath, order: nonNegative(raw.order) };
}
