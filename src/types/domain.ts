export type Competition = "league" | "cup" | "lff";
export type CategoryId = "pre-peque" | "peque" | "mini" | "infantil" | "intermedia" | "superior";
export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled";
export type MatchEventType = "goal" | "yellow-card" | "red-card";
export type GoalTeam = "home" | "away";

export interface GoalEvent {
  id: string;
  team: GoalTeam;
  playerId: string | null;
  playerName: string | null;
}

export interface Club {
  id: string;
  name: string;
  aliases: readonly string[];
  logo: string;
}

export interface TeamRegistration extends Club {
  competition: Competition;
  category: CategoryId;
  active: boolean;
  order: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  birthYears: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  club: string;
  category: CategoryId;
  competition: Competition;
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
}

export interface TeamPhoto {
  id: string;
  competition: Competition;
  category: CategoryId;
  club: string;
  url: string;
  storagePath: string;
  order: number;
}

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  team: string;
  player: string;
  minute?: number | null;
}

export interface Match {
  id: string;
  tournament: "clausura";
  competition: Competition;
  category: CategoryId;
  round: number;
  roundLabel?: string;
  order: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  status: MatchStatus;
  date: string | null;
  time: string | null;
  venue: string | null;
  events?: MatchEvent[];
  goalEvents?: GoalEvent[];
  usesGoalEvents?: boolean;
  version?: number;
  updatedBy?: string;
}

export interface Standing {
  club: Club;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
