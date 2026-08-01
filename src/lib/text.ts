import { CLUBS } from "../config/league";

export function foldText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es");
}

const clubNames = new Map(
  CLUBS.flatMap((club) => [club.name, ...club.aliases].map((name) => [foldText(name), club.name] as const)),
);

export function normalizeClubName(value = "") {
  return clubNames.get(foldText(value)) ?? value.replace(/\s+/g, " ").trim();
}

export function getClub(value: string) {
  const name = normalizeClubName(value);
  return CLUBS.find((club) => club.name === name);
}
