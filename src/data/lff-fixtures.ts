import { CATEGORIES, LFF_CLUBS } from "@/config/league";
import type { Match } from "@/types/domain";

function roundRobin(teams: string[]) {
  const rotating = [...teams];
  const rounds: Array<Array<[string, string]>> = [];
  for (let round = 0; round < rotating.length - 1; round += 1) {
    const pairings: Array<[string, string]> = [];
    for (let index = 0; index < rotating.length / 2; index += 1) {
      const home = rotating[index];
      const away = rotating[rotating.length - 1 - index];
      pairings.push(round % 2 === 0 ? [home, away] : [away, home]);
    }
    rounds.push(pairings);
    rotating.splice(1, 0, rotating.pop()!);
  }
  return rounds;
}

const rounds = roundRobin(LFF_CLUBS.map((club) => club.name));

export const LFF_FIXTURES: Match[] = CATEGORIES.flatMap((category) =>
  rounds.flatMap((matches, roundIndex) => matches.map(([home, away], order) => ({
    id: `lff-${category.id}-r${roundIndex + 1}-m${order + 1}`,
    tournament: "clausura" as const,
    competition: "lff" as const,
    category: category.id,
    round: roundIndex + 1,
    order: order + 1,
    home,
    away,
    homeScore: null,
    awayScore: null,
    status: "scheduled" as const,
    date: null,
    time: null,
    venue: null,
  }))),
);
