import type { RealtimeChannel } from "@supabase/supabase-js";
import { CATEGORY_IDS } from "@/config/league";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Category, CategoryId, Club, Competition, Match, MatchStatus, Player, TeamPhoto } from "@/types/domain";

type ClubRow = { id: string; name: string; aliases: string[]; logo: string; active: boolean };
type ClubCompetitionRow = { club_id: string; competition: string };
type CategoryRow = { id: string; name: string; birth_years: string; sort_order: number; active: boolean };
type PlayerRow = {
  id: string;
  name: string;
  position: string;
  club_id: string;
  category_id: string;
  competition: string;
  goals: number;
  assists: number;
  appearances: number;
  yellow_cards: number;
  red_cards: number;
};
type MatchRow = {
  id: string;
  competition: string;
  category_id: string;
  round: number;
  round_label: string | null;
  sort_order: number;
  home_club_id: string;
  away_club_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  match_date: string | null;
  match_time: string | null;
  venue: string | null;
};
type TeamPhotoRow = {
  id: string;
  competition: string;
  category_id: string;
  club_id: string;
  url: string;
  storage_path: string;
  sort_order: number;
};

const PAGE_SIZE = 1000;
const isCompetition = (value: string): value is Competition => value === "league" || value === "cup" || value === "lff";
const isCategory = (value: string): value is CategoryId => CATEGORY_IDS.includes(value as CategoryId);
const isStatus = (value: string): value is MatchStatus => value === "scheduled" || value === "played" || value === "postponed" || value === "cancelled";

async function fetchAllRows<T>(table: string, select = "*"): Promise<T[]> {
  const client = getSupabaseClient();
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function loadLeagueCatalog() {
  const [clubRows, competitionRows, categoryRows] = await Promise.all([
    fetchAllRows<ClubRow>("clubs"),
    fetchAllRows<ClubCompetitionRow>("club_competitions"),
    fetchAllRows<CategoryRow>("categories"),
  ]);

  const competitionsByClub = new Map<string, Competition[]>();
  for (const row of competitionRows) {
    if (!isCompetition(row.competition)) continue;
    const current = competitionsByClub.get(row.club_id) ?? [];
    if (!current.includes(row.competition)) current.push(row.competition);
    competitionsByClub.set(row.club_id, current);
  }

  const clubs = clubRows.filter((row) => row.active).map<Club & { competitions: Competition[] }>((row) => ({
    id: row.id,
    name: row.name,
    aliases: row.aliases ?? [],
    logo: row.logo ?? "",
    competitions: competitionsByClub.get(row.id) ?? [],
  }));

  const categories = categoryRows
    .filter((row) => row.active && isCategory(row.id))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map<Category>((row) => ({ id: row.id as CategoryId, name: row.name, birthYears: row.birth_years }));

  return { clubs, categories };
}

export async function loadLeagueData() {
  const [clubRows, playerRows, matchRows, photoRows] = await Promise.all([
    fetchAllRows<ClubRow>("clubs"),
    fetchAllRows<PlayerRow>("players"),
    fetchAllRows<MatchRow>("matches"),
    fetchAllRows<TeamPhotoRow>("team_photos"),
  ]);
  const clubNames = new Map(clubRows.map((club) => [club.id, club.name]));

  const players = playerRows.flatMap<Player>((row) => {
    const club = clubNames.get(row.club_id);
    if (!club || !isCategory(row.category_id) || !isCompetition(row.competition)) return [];
    return [{
      id: row.id,
      name: row.name,
      position: row.position || "Jugador",
      club,
      category: row.category_id,
      competition: row.competition,
      goals: row.goals,
      assists: row.assists,
      appearances: row.appearances,
      yellowCards: row.yellow_cards,
      redCards: row.red_cards,
    }];
  });

  const matches = matchRows.flatMap<Match>((row) => {
    const home = clubNames.get(row.home_club_id);
    const away = clubNames.get(row.away_club_id);
    if (!home || !away || !isCategory(row.category_id) || !isCompetition(row.competition) || !isStatus(row.status)) return [];
    return [{
      id: row.id,
      tournament: "clausura",
      competition: row.competition,
      category: row.category_id,
      round: row.round,
      roundLabel: row.round_label ?? undefined,
      order: row.sort_order,
      home,
      away,
      homeScore: row.home_score,
      awayScore: row.away_score,
      status: row.status,
      date: row.match_date,
      time: row.match_time,
      venue: row.venue,
    }];
  });

  const photos = photoRows.flatMap<TeamPhoto>((row) => {
    const club = clubNames.get(row.club_id);
    if (!club || !isCategory(row.category_id) || !isCompetition(row.competition)) return [];
    return [{
      id: row.id,
      competition: row.competition,
      category: row.category_id,
      club,
      url: row.url,
      storagePath: row.storage_path,
      order: row.sort_order,
    }];
  });

  return { matches, players, photos };
}

export function subscribeToLeagueData(callbacks: {
  matches: (matches: Match[]) => void;
  players: (players: Player[]) => void;
  photos: (photos: TeamPhoto[]) => void;
  error: (error: Error) => void;
}) {
  let active = true;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let channel: RealtimeChannel | null = null;

  const refresh = async () => {
    try {
      const data = await loadLeagueData();
      if (!active) return;
      callbacks.matches(data.matches);
      callbacks.players(data.players);
      callbacks.photos(data.photos);
    } catch (error) {
      if (active) callbacks.error(error instanceof Error ? error : new Error("No fue posible leer Supabase."));
    }
  };

  const scheduleRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void refresh(), 150);
  };

  try {
    const client = getSupabaseClient();
    channel = client.channel("public-league-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_photos" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "clubs" }, scheduleRefresh)
      .subscribe();
    void refresh();
  } catch (error) {
    callbacks.error(error instanceof Error ? error : new Error("Supabase no está configurado."));
  }

  return () => {
    active = false;
    if (refreshTimer) clearTimeout(refreshTimer);
    if (channel) void getSupabaseClient().removeChannel(channel);
  };
}
