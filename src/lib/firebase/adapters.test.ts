import { describe, expect, it } from "vitest";
import { fromFirestoreMatch } from "@/lib/firebase/adapters";

describe("adaptador de partidos LIFI Cup", () => {
  it("conserva clubes externos y una fecha aún no numerada", () => {
    const match = fromFirestoreMatch("cup-mini-1", {
      isCup: true,
      tournament: "clausura",
      category: "mini",
      fecha: "Fecha por definir",
      local: "Barnechea",
      visita: "Universidad San Sebastián",
      status: "pending",
      golesL: null,
      golesV: null,
    });

    expect(match).toMatchObject({
      competition: "cup",
      category: "mini",
      round: 99,
      roundLabel: "Fecha por definir",
      home: "Barnechea",
      away: "Universidad San Sebastián",
      status: "scheduled",
    });
  });
});
