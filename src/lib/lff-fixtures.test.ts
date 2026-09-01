import { describe, expect, it } from "vitest";
import { LFF_CLUBS } from "@/config/league";
import { LFF_FIXTURES } from "@/data/lff-fixtures";
import { groupMatchesByRound } from "@/lib/fixtures";
import { calculateStandings } from "@/lib/standings";

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
      homeScore: 0,
      awayScore: 0,
      homePenalties: 3,
      awayPenalties: 2,
      status: "played",
    });
    expect(LFF_FIXTURES[1]).toMatchObject({
      home: "Estadio Español",
      away: "Equipo Médico",
      date: "Miércoles 19 de agosto",
      time: "19:45 hrs",
      venue: "Estadio Español",
    });
    expect(LFF_FIXTURES[2]).toMatchObject({
      home: "Stadio Italiano",
      away: "Sport Academy",
      date: "Miércoles 19 de agosto",
      time: "18:45 hrs",
      venue: "Stadio Italiano",
    });
    expect(LFF_FIXTURES[3]).toMatchObject({
      home: "Club Palestino B",
      away: "Country Club A",
      date: "Miércoles 19 de agosto",
      time: "19:45 hrs",
      venue: "Palestino",
    });
    expect(LFF_FIXTURES.filter((match) => match.round === 1 && match.status === "played")).toHaveLength(4);
  });

  it("publica los resultados confirmados de la fecha 2 con penales y goleadoras", () => {
    const countryEspanol = LFF_FIXTURES.find((match) => match.id === "lff-superior-r2-m1");
    expect(countryEspanol).toMatchObject({
      home: "Country Club B",
      away: "Estadio Español",
      homeScore: 1,
      awayScore: 1,
      homePenalties: 2,
      awayPenalties: 1,
      status: "played",
      date: "Lunes 24 de agosto",
    });
    expect(countryEspanol?.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ team: "Country Club B", player: "García A." }),
      expect.objectContaining({ team: "Estadio Español", player: "Baltra" }),
    ]));

    const manquehueItaliano = LFF_FIXTURES.find((match) => match.id === "lff-superior-r2-m2");
    expect(manquehueItaliano).toMatchObject({
      home: "Club Deportivo Manquehue",
      away: "Stadio Italiano",
      homeScore: 4,
      awayScore: 3,
      status: "played",
      date: "Lunes 24 de agosto",
    });
    expect(manquehueItaliano?.events?.filter((event) => event.player === "Zach")).toHaveLength(2);
    expect(manquehueItaliano?.events?.filter((event) => event.player === "Karmenic")).toHaveLength(2);
    expect(LFF_FIXTURES.filter((match) => match.round === 2 && match.status === "played")).toHaveLength(2);

    const standings = calculateStandings(LFF_FIXTURES, LFF_CLUBS);
    expect(standings.find((standing) => standing.club.name === "Country Club B")?.points).toBe(3);
    expect(standings.find((standing) => standing.club.name === "Estadio Español")?.points).toBe(4);
  });

  it("publica los resultados confirmados de la fecha 3", () => {
    const manquehuePalestino = LFF_FIXTURES.find((match) => match.id === "lff-superior-r3-m3");
    expect(manquehuePalestino).toMatchObject({
      home: "Club Deportivo Manquehue",
      away: "Club Palestino A",
      homeScore: 3,
      awayScore: 1,
      status: "played",
    });

    const countryEspanol = LFF_FIXTURES.find((match) => match.id === "lff-superior-r3-m4");
    expect(countryEspanol).toMatchObject({
      home: "Country Club A",
      away: "Estadio Español",
      homeScore: 3,
      awayScore: 0,
      status: "played",
    });
    expect(countryEspanol?.events?.filter((event) => event.player === "Fontecilla")).toHaveLength(1);
    expect(countryEspanol?.events?.filter((event) => event.player === "Briones")).toHaveLength(2);
  });
});
