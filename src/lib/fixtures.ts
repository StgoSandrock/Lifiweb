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

function valueOrLast(value: string | null) {
  return value && value !== "Por definir" ? value : "9999-99-99";
}

export function displayRound(match: Match) {
  if (match.competition !== "league") return match.round;
  return LEAGUE_ROUND_ORDER[match.round] ?? match.round;
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
