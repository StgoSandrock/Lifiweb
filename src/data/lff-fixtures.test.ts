import { describe, expect, it } from "vitest";
import { CATEGORIES, LFF_CLUBS } from "@/config/league";
import { LFF_FIXTURES } from "@/data/lff-fixtures";

describe("LFF fixture", () => {
  it("creates seven complete rounds for every category", () => {
    expect(LFF_FIXTURES).toHaveLength(CATEGORIES.length * 28);
    for (const category of CATEGORIES) {
      const matches = LFF_FIXTURES.filter((match) => match.category === category.id);
      expect(new Set(matches.map((match) => match.round)).size).toBe(7);
      expect(new Set(matches.flatMap((match) => [match.home, match.away]))).toEqual(new Set(LFF_CLUBS.map((club) => club.name)));
    }
  });

  it("schedules every team exactly once per round", () => {
    for (const category of CATEGORIES) {
      for (let round = 1; round <= 7; round += 1) {
        const teams = LFF_FIXTURES.filter((match) => match.category === category.id && match.round === round).flatMap((match) => [match.home, match.away]);
        expect(teams).toHaveLength(8);
        expect(new Set(teams).size).toBe(8);
      }
    }
  });
});
