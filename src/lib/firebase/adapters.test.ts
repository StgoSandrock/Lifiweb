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

  it("conserva una definición por penales", () => {
    const match = fromFirestoreMatch("lff-1", {
      competition: "lff",
      category: "superior",
      fecha: "Fecha 1",
      local: "Club Palestino A",
      visita: "Country Club B",
      status: "played",
      golesL: 0,
      golesV: 0,
      penalesL: 3,
      penalesV: 2,
    });

    expect(match).toMatchObject({ homePenalties: 3, awayPenalties: 2 });
  });
});
