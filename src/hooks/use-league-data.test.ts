import { describe, expect, it } from "vitest";
import { mergeMatchesWithFallback, mergePlayersWithOfficialStats } from "./use-league-data";
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

  it("preserves official penalty details when the live result omits them", () => {
    const merged = mergeMatchesWithFallback([{
      id: "live-palestino-a",
      tournament: "clausura",
      competition: "lff",
      category: "superior",
      round: 1,
      order: 1,
      home: "Club Palestino A",
      away: "Country Club B",
      homeScore: 0,
      awayScore: 0,
      status: "played",
      date: null,
      time: null,
      venue: null,
    }]);

    expect(merged.find((match) => match.id === "live-palestino-a")).toMatchObject({
      homePenalties: 3,
      awayPenalties: 2,
      date: "Jueves 20 de agosto",
    });
  });

  it("keeps the highest official player totals without duplicating a live player", () => {
    const players = mergePlayersWithOfficialStats([{
      id: "live-garreton",
      name: "Jose Antonio Garreton Gorostegui",
      position: "Jugador",
      club: "Club Manquehue",
      category: "intermedia",
      competition: "league",
      goals: 1,
      assists: 0,
      appearances: 1,
      yellowCards: 0,
      redCards: 0,
    }]);

    expect(players.filter((player) => player.name === "Jose Antonio Garreton Gorostegui")).toHaveLength(1);
    expect(players.find((player) => player.name === "Jose Antonio Garreton Gorostegui")?.goals).toBe(2);
  });
});
