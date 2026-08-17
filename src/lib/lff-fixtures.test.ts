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

  it("invierte la localía por defecto y respeta los ajustes confirmados de la fecha 1", () => {
    expect(LFF_FIXTURES[0]).toMatchObject({
      home: "Club Palestino A",
      away: "Country Club B",
      date: null,
      time: null,
      venue: "Palestino",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    });
    expect(LFF_FIXTURES[1]).toMatchObject({
      home: "Estadio Español",
      away: "Equipo Médico",
      venue: "Estadio Español",
    });
    expect(LFF_FIXTURES[2]).toMatchObject({
      home: "Stadio Italiano",
      away: "Sport Academy",
      venue: "Stadio Italiano",
    });
    expect(LFF_FIXTURES[3]).toMatchObject({
      home: "Club Palestino B",
      away: "Country Club A",
      venue: null,
    });
    expect(LFF_FIXTURES.every((match) => match.date === null && match.homeScore === null && match.awayScore === null)).toBe(true);
  });
});
