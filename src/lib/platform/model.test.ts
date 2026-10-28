import { describe, expect, it } from "vitest";
import {
  archiveSchema,
  fixtureSchema,
  matchesCsv,
  parseArchive,
  standings,
  type Fixture,
  type Team,
  type Tournament,
} from "./model";
const tournament: Tournament = {
  id: "torneo-2027",
  seasonId: "temporada-2027",
  name: "Copa Sur",
  categories: ["Mini"],
  winPoints: 2,
  drawPoints: 1,
  lossPoints: 0,
  published: false,
};
const teams: Team[] = [
  { id: "club-uno", name: "Club Uno", category: "Mini", deleted: false },
  { id: "club-dos", name: "Club Dos", category: "Mini", deleted: false },
];
const match: Fixture = {
  id: "match-uno",
  home: "club-uno",
  away: "club-dos",
  category: "Mini",
  round: 1,
  date: "2027-03-01",
  time: "12:00",
  venue: "Cancha Sur",
  status: "played",
  homeScore: 2,
  awayScore: 0,
  deleted: false,
};
const archive = {
  format: "lifiweb-tournament",
  version: 1,
  organizationId: "liga-sur",
  exportedAt: "2026-10-09T12:00:00Z",
  tournament,
  teams,
  matches: [match],
  players: [],
};
describe("portable league data", () => {
  it("rejects impossible results and dates", () => {
    expect(
      fixtureSchema.safeParse({ ...match, home: match.away }).success,
    ).toBe(false);
    expect(fixtureSchema.safeParse({ ...match, awayScore: null }).success).toBe(
      false,
    );
    expect(
      fixtureSchema.safeParse({ ...match, date: "2027-02-30" }).success,
    ).toBe(false);
    expect(
      fixtureSchema.safeParse({ ...match, status: "scheduled" }).success,
    ).toBe(false);
  });
  it("uses configured points and excludes withdrawals", () => {
    expect(standings(tournament, teams, [match])[0]).toMatchObject({
      id: "club-uno",
      points: 2,
      played: 1,
      gf: 2,
    });
    expect(
      standings(tournament, teams, [{ ...match, deleted: true }])[0].played,
    ).toBe(0);
  });
  it("rejects cross-league imports and invalid relationships", () => {
    expect(() =>
      parseArchive(JSON.stringify(archive), "another-league"),
    ).toThrow("otra liga");
    expect(
      archiveSchema.safeParse({
        ...archive,
        matches: [{ ...match, away: "missing" }],
      }).success,
    ).toBe(false);
    expect(
      archiveSchema.safeParse({ ...archive, teams: [...teams, teams[0]] })
        .success,
    ).toBe(false);
  });
  it("round trips a valid archive without inventing goals", () => {
    expect(
      parseArchive(JSON.stringify(archive), "liga-sur").matches[0],
    ).toEqual(match);
  });
  it("escapes spreadsheet formulas and delimiters", () => {
    const csv = matchesCsv(
      [match],
      [{ ...teams[0], name: '=HYPERLINK("x")' }, teams[1]],
    );
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('""x""');
  });
});
