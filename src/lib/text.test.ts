import { describe, expect, it } from "vitest";
import { CUP_CLUBS_BY_CATEGORY } from "@/config/league";
import { getClub, normalizeClubName } from "@/lib/text";

describe("clubes LIFI Cup", () => {
  it("mantiene la nómina oficial por categoría sin mezclar torneos", () => {
    expect(CUP_CLUBS_BY_CATEGORY["pre-peque"]).toHaveLength(8);
    expect(CUP_CLUBS_BY_CATEGORY.peque).toHaveLength(12);
    expect(CUP_CLUBS_BY_CATEGORY.mini).toHaveLength(10);
  });

  it("publica Futuro Albo en Mini y reconoce su abreviación", () => {
    expect(CUP_CLUBS_BY_CATEGORY.mini?.map((club) => club.name)).toContain("Futuro Albo");
    expect(normalizeClubName("F Albo")).toBe("Futuro Albo");
    expect(getClub("F Albo")?.logo).toBe("/clubs/futuro-albo.jpeg");
  });
});
