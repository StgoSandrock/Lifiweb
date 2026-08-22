import { describe, expect, it } from "vitest";
import { mergeMatchesWithFallback } from "./use-league-data";
import type { Match } from "@/types/domain";

describe("mergeMatchesWithFallback", () => {
  it("deduplicates a live fixture with a different id and keeps the played result", () => {
    const played: Match = {
      id: "firestore-copy",
      tournament: "clausura",
      competition: "league",
      category: "pre-peque",
      round: 1,
      order: 3,
      home: "Club Palestino",
      away: "Club Manquehue",
      homeScore: 4,
      awayScore: 2,
      status: "played",
      date: "2026-08-21",
      time: null,
      venue: null,
    };

    const merged = mergeMatchesWithFallback([played]);
    const palestinoManquehue = merged.filter((match) =>
      match.competition === "league"
      && match.category === "pre-peque"
      && match.round === 1
      && match.home === "Club Palestino"
      && match.away === "Club Manquehue"
    );

    expect(palestinoManquehue).toEqual([played]);
  });

  it("does not merge Club Palestino A with Club Palestino B", () => {
    const matches: Match[] = [
      {
        id: "palestino-a",
        tournament: "clausura",
        competition: "lff",
        category: "superior",
        round: 99,
        order: 1,
        home: "Club Palestino A",
        away: "Country Club B",
        homeScore: 0,
        awayScore: 0,
        status: "played",
        date: "2026-08-20",
        time: null,
        venue: null,
      },
      {
        id: "palestino-b",
        tournament: "clausura",
        competition: "lff",
        category: "superior",
        round: 99,
        order: 2,
        home: "Club Palestino B",
        away: "Country Club A",
        homeScore: 4,
        awayScore: 3,
        status: "played",
        date: "2026-08-20",
        time: null,
        venue: null,
      },
    ];

    const merged = mergeMatchesWithFallback(matches);
    expect(merged).toEqual(expect.arrayContaining(matches));
    expect(merged.filter((match) => matches.some(({ id }) => id === match.id))).toHaveLength(2);
  });
});
