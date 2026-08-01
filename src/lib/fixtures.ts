import type { Match } from "@/types/domain";

function valueOrLast(value: string | null) {
  return value && value !== "Por definir" ? value : "9999-99-99";
}

export function sortMatches(matches: readonly Match[]) {
  return [...matches].sort((a, b) =>
    a.round - b.round
    || valueOrLast(a.date).localeCompare(valueOrLast(b.date))
    || valueOrLast(a.time).localeCompare(valueOrLast(b.time))
    || a.order - b.order
    || a.home.localeCompare(b.home, "es"),
  );
}

export function groupMatchesByRound(matches: readonly Match[]) {
  const groups = new Map<number, Match[]>();
  for (const match of sortMatches(matches)) {
    groups.set(match.round, [...(groups.get(match.round) ?? []), match]);
  }
  return [...groups.entries()];
}
