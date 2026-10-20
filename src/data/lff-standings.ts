import { LFF_CLUBS } from "@/config/league";
import type { Standing } from "@/types/domain";

const clubByName = new Map(LFF_CLUBS.map((club) => [club.name, club]));

function standing(
  clubName: string,
  played: number,
  won: number,
  drawn: number,
  lost: number,
  goalsFor: number,
  goalsAgainst: number,
  points: number,
): Standing {
  const club = clubByName.get(clubName);
  if (!club) throw new Error(`Club LFF no encontrado: ${clubName}`);

  return {
    club,
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points,
  };
}

export const LFF_OFFICIAL_STANDINGS: Standing[] = [
  standing("Club Palestino B", 6, 5, 0, 1, 17, 9, 15),
  standing("Country Club A", 5, 4, 0, 1, 19, 5, 12),
  standing("Stadio Italiano", 6, 4, 0, 2, 20, 11, 12),
  standing("Estadio Español", 5, 3, 1, 1, 8, 6, 10),
  standing("Club Deportivo Manquehue", 5, 3, 0, 2, 11, 9, 9),
  standing("Equipo Médico", 5, 2, 1, 2, 5, 7, 7),
  standing("Country Club B", 6, 1, 2, 3, 3, 11, 6),
  standing("Club Palestino A", 7, 0, 2, 5, 7, 13, 4),
  standing("Sport Academy", 7, 0, 2, 5, 3, 19, 2),
];
