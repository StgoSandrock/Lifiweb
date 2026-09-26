import type { GoalEvent, GoalTeam, Match, Player } from "@/types/domain";

export function scoreFromGoalEvents(events: readonly GoalEvent[]) {
  return events.reduce((score, event) => {
    score[event.team] += 1;
    return score;
  }, { home: 0, away: 0 });
}

export function eventsForEditor(match: Match, players: readonly Player[] = []): GoalEvent[] {
  if (match.usesGoalEvents) return (match.goalEvents ?? []).map((event) => ({ ...event }));
  const events: GoalEvent[] = [];
  for (const team of ["home", "away"] as const) {
    const total = team === "home" ? match.homeScore ?? 0 : match.awayScore ?? 0;
    const club = team === "home" ? match.home : match.away;
    const legacy = (match.events ?? []).filter((event) => event.type === "goal" && event.team === club).slice(0, total);
    for (let index = 0; index < total; index += 1) {
      const legacyName = legacy[index]?.player || null;
      const scorer = legacyName ? players.find((player) => player.club === club && player.name === legacyName) : null;
      events.push({ id: legacy[index]?.id || `legacy-${team}-${index + 1}`, team, playerId: scorer?.id ?? null, playerName: scorer?.name ?? legacyName });
    }
  }
  return events;
}

export function addGoalEvent(events: readonly GoalEvent[], team: GoalTeam, id: string): GoalEvent[] {
  return [...events, { id, team, playerId: null, playerName: null }];
}

export function removeLastGoalEvent(events: readonly GoalEvent[], team: GoalTeam): GoalEvent[] {
  const index = events.findLastIndex((event) => event.team === team);
  return index < 0 ? [...events] : events.filter((_, eventIndex) => eventIndex !== index);
}

export function assignGoalEvent(events: readonly GoalEvent[], eventId: string, player: Player | null): GoalEvent[] {
  return events.map((event) => event.id === eventId ? { ...event, playerId: player?.id ?? null, playerName: player?.name ?? null } : event);
}

export function derivePlayerGoals(players: readonly Player[], matches: readonly Match[]): Player[] {
  const trackedScopes = new Set(matches.filter((match) => match.usesGoalEvents).map((match) => `${match.competition}|${match.category}`));
  const totals = new Map<string, number>();
  for (const match of matches) {
    if (!match.usesGoalEvents) continue;
    for (const event of match.goalEvents ?? []) {
      if (event.playerId) totals.set(event.playerId, (totals.get(event.playerId) ?? 0) + 1);
    }
  }
  return players.map((player) => trackedScopes.has(`${player.competition}|${player.category}`)
    ? { ...player, goals: totals.get(player.id) ?? 0 }
    : player);
}

export function assertCurrentVersion(currentVersion: number, expectedVersion: number) {
  if (currentVersion !== expectedVersion) throw new Error("MATCH_CONFLICT");
}
