import { describe, expect, it } from "vitest";
import type { GoalEvent, Match, Player } from "@/types/domain";
import { addGoalEvent, assertCurrentVersion, assignGoalEvent, derivePlayerGoals, eventsForEditor, removeLastGoalEvent, scoreFromGoalEvents } from "./goal-events";

const match = (overrides: Partial<Match> = {}): Match => ({
  id: "match-1", tournament: "clausura", competition: "league", category: "mini",
  round: 1, order: 1, home: "Local", away: "Visita", homeScore: null,
  awayScore: null, status: "scheduled", date: null, time: null, venue: null,
  ...overrides,
});

const player = (id: string, club: string, goals = 9): Player => ({
  id, name: id, club, position: "Jugador", category: "mini", competition: "league",
  goals, assists: 0, appearances: 0, yellowCards: 0, redCards: 0,
});

describe("editor rápido de resultados", () => {
  it("construye un 3-2 sin exigir goleadores", () => {
    let events: GoalEvent[] = [];
    for (let index = 0; index < 3; index += 1) events = addGoalEvent(events, "home", `h-${index}`);
    for (let index = 0; index < 2; index += 1) events = addGoalEvent(events, "away", `a-${index}`);
    expect(scoreFromGoalEvents(events)).toEqual({ home: 3, away: 2 });
    expect(events.every((event) => event.playerId === null)).toBe(true);
  });

  it("permite asignar, desasignar y corregir goles", () => {
    const scorer = player("jugador-1", "Local");
    let events = addGoalEvent([], "home", "goal-1");
    events = assignGoalEvent(events, "goal-1", scorer);
    expect(events[0]).toMatchObject({ playerId: scorer.id, playerName: scorer.name });
    events = assignGoalEvent(events, "goal-1", null);
    expect(events[0]).toMatchObject({ playerId: null, playerName: null });
    expect(removeLastGoalEvent(events, "home")).toEqual([]);
  });

  it("abre resultados históricos como goles sin asignar, sin perder el marcador", () => {
    const events = eventsForEditor(match({ status: "played", homeScore: 3, awayScore: 1 }));
    expect(scoreFromGoalEvents(events)).toEqual({ home: 3, away: 1 });
    expect(events).toHaveLength(4);
    expect(events.every((event) => event.playerId === null)).toBe(true);
  });

  it("recalcula goleadores desde el estado actual y no acumula ediciones", () => {
    const players = [player("uno", "Local"), player("dos", "Visita")];
    const first = match({ usesGoalEvents: true, goalEvents: [
      { id: "g1", team: "home", playerId: "uno", playerName: "uno" },
      { id: "g2", team: "away", playerId: "dos", playerName: "dos" },
    ] });
    expect(derivePlayerGoals(players, [first]).map(({ goals }) => goals)).toEqual([1, 1]);
    const corrected = match({ usesGoalEvents: true, goalEvents: [
      { id: "g1", team: "home", playerId: "uno", playerName: "uno" },
    ] });
    expect(derivePlayerGoals(players, [corrected]).map(({ goals }) => goals)).toEqual([1, 0]);
  });

  it("mantiene estadísticas históricas en categorías aún no migradas", () => {
    expect(derivePlayerGoals([player("uno", "Local", 7)], [match()])[0].goals).toBe(7);
  });

  it("detecta una edición concurrente por versión", () => {
    expect(() => assertCurrentVersion(3, 2)).toThrow("MATCH_CONFLICT");
    expect(() => assertCurrentVersion(3, 3)).not.toThrow();
  });
});
