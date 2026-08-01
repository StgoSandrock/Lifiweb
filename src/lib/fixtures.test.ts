import { describe, expect, it } from "vitest";
import fixtures from "@/data/league-fixtures.json";
import { groupMatchesByRound, sortMatches } from "@/lib/fixtures";
import type { Match } from "@/types/domain";

describe("fixture Clausura", () => {
  const matches = fixtures as Match[];

  it("contiene 225 partidos, 45 por categoría y nueve fechas", () => {
    expect(matches).toHaveLength(225);
    for (const category of ["pre-peque", "peque", "mini", "infantil", "intermedia"]) {
      const categoryMatches = matches.filter((match) => match.category === category);
      expect(categoryMatches).toHaveLength(45);
      expect(groupMatchesByRound(categoryMatches)).toHaveLength(9);
    }
  });

  it("ordena por fecha, calendario, hora y orden independientemente del origen", () => {
    const shuffled = [
      { ...matches[10], round: 2, date: null, time: null, order: 5 },
      { ...matches[0], round: 1, date: "2026-09-01", time: "10:00", order: 2 },
      { ...matches[1], round: 1, date: "2026-08-01", time: "12:00", order: 3 },
    ];
    expect(sortMatches(shuffled).map((match) => match.date)).toEqual(["2026-08-01", "2026-09-01", null]);
  });

  it("cada club juega una vez por fecha", () => {
    const categoryMatches = matches.filter((match) => match.category === "pre-peque");
    for (const [, roundMatches] of groupMatchesByRound(categoryMatches)) {
      const appearances = roundMatches.flatMap((match) => [match.home, match.away]);
      expect(new Set(appearances).size).toBe(10);
      expect(appearances).toHaveLength(10);
    }
  });
});
