import type { Match } from "../types/domain";

const LEAGUE_ROUND_ORDER: Readonly<Record<number, number>> = {
  1: 1,
  2: 2,
  3: 5,
  4: 7,
  5: 3,
  6: 8,
  7: 9,
  8: 4,
  9: 6,
};

const LEAGUE_WEEK_BY_ROUND: Readonly<Record<number, string>> = {
  1: "Semana del 22 de agosto de 2026",
  2: "Semana del 29 de agosto de 2026",
  3: "Semana del 5 de septiembre de 2026",
  4: "Semana del 12 de septiembre de 2026",
  5: "Semana del 3 de octubre de 2026",
  6: "Semana del 7 de octubre de 2026",
  7: "Semana del 24 de octubre de 2026",
  8: "Semana del 7 de noviembre de 2026",
  9: "Semana del 21 de noviembre de 2026",
};

function valueOrLast(value: string | null) {
  return value && value !== "Por definir" ? value : "9999-99-99";
}

export function displayRound(match: Match) {
  if (match.competition !== "league") return match.round;
  return LEAGUE_ROUND_ORDER[match.round] ?? match.round;
}

export function scheduledWeek(match: Match) {
  if (match.competition !== "league") return null;
  return LEAGUE_WEEK_BY_ROUND[displayRound(match)] ?? null;
}

export function sortMatches(matches: readonly Match[]) {
  return [...matches].sort((a, b) =>
    displayRound(a) - displayRound(b)
    || valueOrLast(a.date).localeCompare(valueOrLast(b.date))
    || valueOrLast(a.time).localeCompare(valueOrLast(b.time))
    || a.order - b.order
    || a.home.localeCompare(b.home, "es"),
  );
}

export function groupMatchesByRound(matches: readonly Match[]) {
  const groups = new Map<number, Match[]>();
  for (const match of sortMatches(matches)) {
    const round = displayRound(match);
    groups.set(round, [...(groups.get(round) ?? []), match]);
  }
  return [...groups.entries()];
}
