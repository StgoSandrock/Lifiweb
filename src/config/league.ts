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

export const CLUBS: readonly Club[] = [
  { id: "israelita", name: "Estadio Israelita", aliases: ["Israelita"], logo: "/clubs/israelita.svg" },
  { id: "espanol", name: "Estadio Español", aliases: ["Estadio Espanol", "Español"], logo: "/clubs/espanol.svg" },
  { id: "manquehue", name: "Club Manquehue", aliases: ["Manquehue"], logo: "/clubs/manquehue.svg" },
  { id: "palestino", name: "Club Palestino", aliases: ["Palestino"], logo: "/clubs/palestino.svg" },
  { id: "bianconero", name: "Bianconero", aliases: [], logo: "/clubs/bianconero.svg" },
  { id: "italiano", name: "Stadio Italiano", aliases: ["Stadio", "Italiano"], logo: "/clubs/italiano.svg" },
  { id: "lif", name: "LIF", aliases: ["L.I.F."], logo: "/clubs/lif.svg" },
  { id: "ultimate", name: "Ultimate S.A.", aliases: ["Ultimate S.A", "Ultimate"], logo: "/clubs/ultimate.svg" },
  { id: "croata", name: "Estadio Croata", aliases: ["Croata"], logo: "/clubs/croata.svg" },
  { id: "inter", name: "Inter", aliases: [], logo: "/clubs/inter.png" },
] as const;

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id) as CategoryId[];
