import { describe, expect, it } from "vitest";
import { CUP_FIXTURES } from "@/data/cup-fixtures";
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

  it("publica los marcadores de la planilla consolidada de la fecha 5", () => {
    const confirmed = new Map([
      ["clausura-pre-peque-f1-p4", [1, 2]],
      ["clausura-pre-peque-f5-p2", [2, 1]],
      ["clausura-pre-peque-f5-p4", [2, 6]],
      ["clausura-pre-peque-f5-p5", [4, 1]],
      ["clausura-peque-f5-p1", [2, 0]],
      ["clausura-peque-f5-p2", [5, 0]],
      ["clausura-peque-f5-p5", [3, 1]],
      ["clausura-mini-f5-p1", [13, 0]],
      ["clausura-mini-f5-p4", [4, 6]],
      ["clausura-infantil-f5-p1", [2, 2]],
      ["clausura-infantil-f5-p3", [1, 1]],
      ["clausura-intermedia-f5-p4", [1, 0]],
    ]);

    for (const [id, [homeScore, awayScore]] of confirmed) {
      expect(matches.find((match) => match.id === id)).toMatchObject({ homeScore, awayScore, status: "played" });
    }
  });

  it("publica los resultados de LIF contra Bianconero y mantiene Infantil pendiente", () => {
    const confirmed = new Map([
      ["clausura-pre-peque-f8-p5", [0, 3]],
      ["clausura-peque-f8-p5", [2, 4]],
      ["clausura-mini-f8-p5", [1, 2]],
      ["clausura-intermedia-f8-p5", [0, 7]],
    ]);

    for (const [id, [homeScore, awayScore]] of confirmed) {
      expect(matches.find((match) => match.id === id)).toMatchObject({
        home: "LIF",
        away: "Bianconero",
        homeScore,
        awayScore,
        status: "played",
      });
    }

    expect(matches.find((match) => match.id === "clausura-infantil-f8-p5")).toMatchObject({
      home: "LIF",
      away: "Bianconero",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    });
  });

  it("publica los cinco resultados de Palestino contra Ultimate con localía y fecha correctas", () => {
    const confirmed = new Map([
      ["clausura-pre-peque-f8-p2", [10, 2, "Sábado 12 de septiembre de 2026"]],
      ["clausura-peque-f8-p2", [3, 2, "Sábado 12 de septiembre de 2026"]],
      ["clausura-mini-f8-p2", [2, 3, "Viernes 11 de septiembre de 2026"]],
      ["clausura-infantil-f8-p2", [1, 3, "Viernes 11 de septiembre de 2026"]],
      ["clausura-intermedia-f8-p2", [0, 7, "Viernes 11 de septiembre de 2026"]],
    ]);

    for (const [id, [homeScore, awayScore, date]] of confirmed) {
      expect(matches.find((match) => match.id === id)).toMatchObject({
        home: "Club Palestino",
        away: "Ultimate S.A",
        homeScore,
        awayScore,
        status: "played",
        date,
        venue: "Palestino",
      });
    }
  });
});

describe("fixture LIFI Cup", () => {
  it("publica únicamente los resultados confirmados de la primera semana", () => {
    const confirmed = new Map([
      ["cup-2026-pre-peque-f1-p3", [3, 2]],
      ["cup-2026-pre-peque-f1-p4", [3, 4]],
      ["cup-2026-peque-f1-p1", [2, 2]],
      ["cup-2026-peque-f1-p5", [4, 0]],
      ["cup-2026-mini-f1-p1", [2, 1]],
      ["cup-2026-mini-f1-p2", [2, 4]],
      ["cup-2026-mini-f1-p3", [3, 1]],
      ["cup-2026-mini-f1-p4", [1, 2]],
    ]);

    for (const [id, [homeScore, awayScore]] of confirmed) {
      expect(CUP_FIXTURES.find((match) => match.id === id)).toMatchObject({ homeScore, awayScore, status: "played" });
    }
    expect(CUP_FIXTURES.find((match) => match.id === "cup-2026-mini-f1-p2")).toMatchObject({
      home: "Barnechea",
      away: "Alumni",
    });
    expect(CUP_FIXTURES.find((match) => match.id === "cup-2026-peque-f1-p3")).toMatchObject({ status: "scheduled", homeScore: null, awayScore: null });
    expect(CUP_FIXTURES.find((match) => match.id === "cup-2026-infantil-f1-p2")).toMatchObject({ status: "scheduled", homeScore: null, awayScore: null });
  });

  it("publica el triunfo de Manquehue sobre Barnechea en Infantil", () => {
    expect(CUP_FIXTURES.find((match) => match.id === "cup-2026-infantil-f2-p2")).toMatchObject({
      home: "Barnechea",
      away: "Club Manquehue",
      homeScore: 2,
      awayScore: 5,
      status: "played",
    });
  });
});
