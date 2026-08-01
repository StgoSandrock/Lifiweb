import { CLUBS } from "@/config/league";
import type { Club, Match, Standing } from "@/types/domain";
import { normalizeClubName } from "@/lib/text";

function validPlayedMatch(match: Match) {
  return match.status === "played"
    && Number.isInteger(match.homeScore)
    && Number.isInteger(match.awayScore)
    && (match.homeScore ?? -1) >= 0
    && (match.awayScore ?? -1) >= 0;
}

export function calculateStandings(matches: readonly Match[], clubs: readonly Club[] = CLUBS): Standing[] {
  const rows = new Map(clubs.map((club) => [club.name, {
    club,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  } satisfies Standing]));

  for (const match of matches.filter(validPlayedMatch)) {
    const home = rows.get(normalizeClubName(match.home));
    const away = rows.get(normalizeClubName(match.away));
    if (!home || !away) continue;
    const homeScore = match.homeScore as number;
    const awayScore = match.awayScore as number;
    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;
    if (homeScore > awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (homeScore < awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return [...rows.values()].sort((a, b) =>
    b.points - a.points
    || b.goalDifference - a.goalDifference
    || b.goalsFor - a.goalsFor
    || a.club.name.localeCompare(b.club.name, "es"),
  );
}
