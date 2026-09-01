import type { Category, CategoryId, Club } from "../types/domain";

export const SEASON = 2026;
export const ACTIVE_TOURNAMENT = "clausura" as const;

export const CATEGORIES: readonly Category[] = [
  { id: "pre-peque", name: "Pre-Peque", birthYears: "2017–2018" },
  { id: "peque", name: "Peque", birthYears: "2015–2016" },
  { id: "mini", name: "Mini", birthYears: "2013–2014" },
  { id: "infantil", name: "Infantil", birthYears: "2011–2012" },
  { id: "intermedia", name: "Intermedia", birthYears: "2009–2010" },
] as const;

export const CUP_CATEGORIES: readonly Category[] = CATEGORIES.filter((category) => category.id !== "intermedia");

export const LFF_CATEGORIES: readonly Category[] = [
  { id: "superior", name: "Superior", birthYears: "Categoría única" },
] as const;

export const CLUBS: readonly Club[] = [
  { id: "israelita", name: "Estadio Israelita", aliases: ["Israelita"], logo: "/clubs/israelita.svg" },
  { id: "espanol", name: "Estadio Español", aliases: ["Estadio Espanol", "Español"], logo: "/clubs/espanol.svg" },
  { id: "manquehue", name: "Club Manquehue", aliases: ["Manquehue"], logo: "/clubs/manquehue.svg" },
  { id: "palestino", name: "Club Palestino", aliases: ["Palestino"], logo: "/clubs/palestino.svg" },
  { id: "bianconero", name: "Bianconero", aliases: [], logo: "/clubs/bianconero.svg" },
  { id: "italiano", name: "Stadio Italiano", aliases: ["Stadio", "Italiano"], logo: "/clubs/italiano.svg" },
  { id: "lif", name: "LIF", aliases: ["L.I.F."], logo: "/clubs/lif.svg" },
  { id: "ultimate", name: "Ultimate S.A.", aliases: ["Ultimate S.A", "Ultimate", "Ultimate Sports Academy"], logo: "/clubs/ultimate-sports-academy.jpeg" },
  { id: "croata", name: "Estadio Croata", aliases: ["Croata"], logo: "/clubs/croata.svg" },
  { id: "inter", name: "Inter", aliases: [], logo: "/clubs/inter.svg" },
] as const;

export const CUP_CLUBS: readonly Club[] = [
  { id: "futuro-albo", name: "Futuro Albo", aliases: ["F Albo", "F. Albo"], logo: "/clubs/futuro-albo.jpeg" },
  { id: "uss", name: "USS", aliases: ["Universidad San Sebastián", "Universidad San Sebastian"], logo: "/clubs/uss.jpeg" },
  { id: "diablos-rojos", name: "D Rojos", aliases: ["Diablos Rojos", "D. Rojos"], logo: "/clubs/diablos-rojos.jpeg" },
  { id: "alumni", name: "Alumni", aliases: ["Club Deportivo Alumni"], logo: "/clubs/alumni.jpeg" },
  { id: "country-club-cup", name: "C Club", aliases: ["Country Club"], logo: "/clubs/country-club.png" },
] as const;

export const CUP_CLUBS_BY_CATEGORY: Partial<Record<CategoryId, readonly Club[]>> = {
  mini: CUP_CLUBS.filter((club) => club.id === "futuro-albo"),
};

export const LFF_CLUBS: readonly Club[] = [
  { id: "lff-palestino-a", name: "Club Palestino A", aliases: [], logo: "/clubs/palestino.svg" },
  { id: "lff-palestino-b", name: "Club Palestino B", aliases: [], logo: "/clubs/palestino.svg" },
  { id: "lff-equipo-medico", name: "Equipo Médico", aliases: ["Equipo Medico"], logo: "/clubs/equipo-medico.png" },
  { id: "lff-manquehue", name: "Club Deportivo Manquehue", aliases: [], logo: "/clubs/manquehue.svg" },
  { id: "lff-estadio-espanol", name: "Estadio Español", aliases: ["Estadio Espanol"], logo: "/clubs/espanol.svg" },
  { id: "lff-stadio-italiano", name: "Stadio Italiano", aliases: [], logo: "/clubs/italiano.svg" },
  { id: "lff-country-club-a", name: "Country Club A", aliases: [], logo: "/clubs/country-club.png" },
  { id: "lff-country-club-b", name: "Country Club B", aliases: [], logo: "/clubs/country-club.png" },
  { id: "lff-sport-academy", name: "Sport Academy", aliases: [], logo: "" },
] as const;

export function clubsForCompetition(competition: import("../types/domain").Competition) {
  return competition === "lff" ? LFF_CLUBS : CLUBS;
}

export function categoriesForCompetition(competition: import("../types/domain").Competition) {
  if (competition === "lff") return LFF_CATEGORIES;
  if (competition === "cup") return CUP_CATEGORIES;
  return CATEGORIES;
}

export const CATEGORY_IDS = [...CATEGORIES, ...LFF_CATEGORIES].map((category) => category.id) as CategoryId[];
