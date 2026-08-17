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

  it("respeta localías, canchas y programación confirmadas de la fecha 1", () => {
    expect(LFF_FIXTURES[0]).toMatchObject({
      home: "Club Palestino A",
      away: "Country Club B",
      date: "Jueves 20 de agosto",
      time: "19:45 hrs",
      venue: "Palestino",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    });
    expect(LFF_FIXTURES[1]).toMatchObject({
      home: "Estadio Español",
      away: "Equipo Médico",
      date: "Miércoles 19 de agosto",
      time: "19:45 hrs",
      venue: "Estadio Español",
    });
    expect(LFF_FIXTURES[2]).toMatchObject({
      home: "Sport Academy",
      away: "Stadio Italiano",
      date: "Miércoles 19 de agosto",
      time: "18:45 hrs",
      venue: "Stadio Italiano",
    });
    expect(LFF_FIXTURES[3]).toMatchObject({
      home: "Club Palestino B",
      away: "Country Club A",
      date: "Miércoles 19 de agosto",
      time: "19:45 hrs",
      venue: null,
    });
    expect(LFF_FIXTURES.every((match) => match.homeScore === null && match.awayScore === null)).toBe(true);
  });
});
