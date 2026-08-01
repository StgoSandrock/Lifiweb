import { describe, expect, it } from "vitest";
import { matchInputSchema } from "@/lib/validation";

const valid = {
  id: "m1", category: "pre-peque" as const, round: 1, home: "Inter", away: "LIF",
  status: "scheduled" as const, date: null, time: null, venue: null, homeScore: null, awayScore: null,
};

describe("validación de partidos", () => {
  it("rechaza equipos iguales y resultados negativos", () => {
    expect(matchInputSchema.safeParse({ ...valid, away: "Inter" }).success).toBe(false);
    expect(matchInputSchema.safeParse({ ...valid, status: "played", homeScore: -1, awayScore: 0 }).success).toBe(false);
  });

  it("rechaza resultados para partidos pendientes y marcadores incompletos", () => {
    expect(matchInputSchema.safeParse({ ...valid, homeScore: 0, awayScore: 0 }).success).toBe(false);
    expect(matchInputSchema.safeParse({ ...valid, status: "played", homeScore: 0 }).success).toBe(false);
  });
});
