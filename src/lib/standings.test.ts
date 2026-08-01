import { describe, expect, it } from "vitest";
import { CLUBS } from "@/config/league";
import { calculateStandings } from "@/lib/standings";
import type { Match } from "@/types/domain";

function match(overrides: Partial<Match>): Match {
  return {
    id: "test",
    tournament: "clausura",
    competition: "league",
    category: "pre-peque",
    round: 1,
    order: 1,
    home: "Inter",
    away: "LIF",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    date: null,
    time: null,
    venue: null,
    ...overrides,
  };
}

function row(matches: Match[], club: string) {
  return calculateStandings(matches, CLUBS).find((standing) => standing.club.name === club)!;
}

describe("calculateStandings", () => {
  it("calcula victoria y derrota con tres puntos", () => {
    const matches = [match({ status: "played", homeScore: 2, awayScore: 1 })];
    expect(row(matches, "Inter")).toMatchObject({ played: 1, won: 1, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 });
    expect(row(matches, "LIF")).toMatchObject({ played: 1, lost: 1, points: 0 });
  });

  it("cuenta un empate 0–0 marcado explícitamente como jugado", () => {
    const matches = [match({ status: "played", homeScore: 0, awayScore: 0 })];
    expect(row(matches, "Inter")).toMatchObject({ played: 1, drawn: 1, points: 1 });
    expect(row(matches, "LIF")).toMatchObject({ played: 1, drawn: 1, points: 1 });
  });

  it("ignora un partido pendiente aunque tenga ceros accidentales", () => {
    const matches = [match({ status: "scheduled", homeScore: 0, awayScore: 0 })];
    expect(row(matches, "Inter")).toMatchObject({ played: 0, points: 0 });
  });

  it("ignora un marcador incompleto", () => {
    const matches = [match({ status: "played", homeScore: 1, awayScore: null })];
    expect(row(matches, "Inter")).toMatchObject({ played: 0, points: 0 });
  });

  it("desempata por puntos, diferencia de gol y goles a favor", () => {
    const matches = [
      match({ id: "a", home: "Inter", away: "LIF", status: "played", homeScore: 2, awayScore: 0 }),
      match({ id: "b", home: "Bianconero", away: "Estadio Croata", status: "played", homeScore: 3, awayScore: 1 }),
    ];
    expect(calculateStandings(matches).filter((item) => item.points === 3).map((item) => item.club.name)).toEqual(["Bianconero", "Inter"]);
  });
});
