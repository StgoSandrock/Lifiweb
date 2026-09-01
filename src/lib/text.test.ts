import { describe, expect, it } from "vitest";
import { CUP_CLUBS_BY_CATEGORY } from "@/config/league";
import { getClub, normalizeClubName } from "@/lib/text";

describe("clubes LIFI Cup", () => {
  it("publica Futuro Albo en Mini y reconoce su abreviación", () => {
    expect(CUP_CLUBS_BY_CATEGORY.mini?.map((club) => club.name)).toContain("Futuro Albo");
    expect(normalizeClubName("F Albo")).toBe("Futuro Albo");
    expect(getClub("F Albo")?.logo).toBe("/clubs/futuro-albo.jpeg");
  });
});
