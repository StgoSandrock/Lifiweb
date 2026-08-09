import { describe, expect, it } from "vitest";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { groupMatchesByRound } from "@/lib/fixtures";

describe("fixture oficial LFF", () => {
  it("publica nueve fechas, nueve clubes y una sola categoría Superior", () => {
    expect(groupMatchesByRound(LFF_FIXTURES)).toHaveLength(9);
    expect(new Set(LFF_FIXTURES.flatMap((match) => [match.home, match.away])).size).toBe(9);
    expect(new Set(LFF_FIXTURES.map((match) => match.category))).toEqual(new Set(["superior"]));
    expect(LFF_FIXTURES.some((match) => match.home === "Sport Academy" || match.away === "Sport Academy")).toBe(true);
  });

  it("invierte la localía del documento y mantiene programación pendiente", () => {
    expect(LFF_FIXTURES[0]).toMatchObject({
      home: "Country Club B",
      away: "Club Palestino A",
      date: null,
      time: null,
      venue: null,
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    });
    expect(LFF_FIXTURES.every((match) => match.date === null && match.homeScore === null && match.awayScore === null)).toBe(true);
  });
});
