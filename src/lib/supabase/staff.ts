import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { matchInputSchema, playerInputSchema } from "@/lib/validation";
import type { Category, CategoryId, Club, Competition, Match, Player, TeamPhoto } from "@/types/domain";

export type StaffClub = Club & { competitions: Competition[] };
export type StaffCategory = Category & { sortOrder: number; active: boolean };

async function requireStaff(user: User | null) {
  if (!user) throw new Error("Sesión Staff no autorizada.");
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("staff_users")
    .select("active,role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data?.active) throw new Error("La cuenta inició sesión, pero no posee un rol Staff activo.");
  return client;
}

export async function isStaffUser(user: User | null) {
  try {
    await requireStaff(user);
    return true;
  } catch {
    return false;
  }
}

export async function signInStaff(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  if (!(await isStaffUser(data.user))) {
    await client.auth.signOut();
    throw new Error("La cuenta inició sesión, pero no posee el rol Staff.");
  }
  return data.user;
}

export async function signOutStaff() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export function observeStaffUser(callback: (user: User | null) => void) {
  const client = getSupabaseClient();
  void client.auth.getUser().then(({ data }) => callback(data.user ?? null)).catch(() => callback(null));
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
  return () => data.subscription.unsubscribe();
}

async function loadClubIdentity() {
  const client = getSupabaseClient();
  const [{ data: clubs, error: clubsError }, { data: links, error: linksError }] = await Promise.all([
    client.from("clubs").select("id,name,aliases,logo,active"),
    client.from("club_competitions").select("club_id,competition"),
  ]);
  if (clubsError) throw clubsError;
  if (linksError) throw linksError;
  return { clubs: clubs ?? [], links: links ?? [] };
}

async function resolveClubId(name: string, competition: Competition) {
  const { clubs, links } = await loadClubIdentity();
  const allowedIds = new Set(links.filter((link) => link.competition === competition).map((link) => link.club_id));
  const normalized = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const match = clubs.find((club) => allowedIds.has(club.id) && [club.name, ...(club.aliases ?? [])].some((candidate) => candidate.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalized));
  if (!match) throw new Error(`No existe el club ${name} en la competencia seleccionada.`);
  return match.id;
}

export async function loadStaffCatalog(user: User) {
  await requireStaff(user);
  const client = getSupabaseClient();
  const [{ data: clubs, error: clubsError }, { data: links, error: linksError }, { data: categories, error: categoriesError }] = await Promise.all([
    client.from("clubs").select("id,name,aliases,logo,active").order("name"),
    client.from("club_competitions").select("club_id,competition"),
    client.from("categories").select("id,name,birth_years,sort_order,active").order("sort_order"),
  ]);
  if (clubsError) throw clubsError;
  if (linksError) throw linksError;
  if (categoriesError) throw categoriesError;

  const competitionsByClub = new Map<string, Competition[]>();
  for (const link of links ?? []) {
    if (link.competition !== "league" && link.competition !== "cup" && link.competition !== "lff") continue;
    const current = competitionsByClub.get(link.club_id) ?? [];
    current.push(link.competition);
    competitionsByClub.set(link.club_id, current);
  }

  return {
    clubs: (clubs ?? []).map<StaffClub>((club) => ({
      id: club.id,
      name: club.name,
      aliases: club.aliases ?? [],
      logo: club.logo ?? "",
      competitions: competitionsByClub.get(club.id) ?? [],
    })),
    categories: (categories ?? []).flatMap<StaffCategory>((category) => {
      if (!["pre-peque", "peque", "mini", "infantil", "intermedia", "superior"].includes(category.id)) return [];
      return [{
        id: category.id as CategoryId,
        name: category.name,
        birthYears: category.birth_years,
        sortOrder: category.sort_order,
        active: category.active,
      }];
    }),
  };
}

export async function saveMatch(input: Match, user: User) {
  const client = await requireStaff(user);
  const parsed = matchInputSchema.parse(input);
  const [homeClubId, awayClubId] = await Promise.all([
    resolveClubId(parsed.home, input.competition),
    resolveClubId(parsed.away, input.competition),
  ]);
  const { error } = await client.from("matches").upsert({
    id: parsed.id,
    season: 2026,
    tournament: "clausura",
    competition: input.competition,
    category_id: parsed.category,
    round: parsed.round,
    round_label: input.roundLabel ?? null,
    sort_order: Number.isInteger(input.order) && input.order >= 0 ? input.order : 99,
    home_club_id: homeClubId,
    away_club_id: awayClubId,
    home_score: parsed.status === "played" ? parsed.homeScore : null,
    away_score: parsed.status === "played" ? parsed.awayScore : null,
    status: parsed.status,
    match_date: parsed.date,
    match_time: parsed.time,
    venue: parsed.venue,
    updated_by: user.id,
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteMatch(matchId: string, user: User) {
  const client = await requireStaff(user);
  const { error } = await client.from("matches").delete().eq("id", matchId);
  if (error) throw error;
}

export async function savePlayer(input: Omit<Player, "id"> & { id?: string }, user: User) {
  const client = await requireStaff(user);
  const parsed = playerInputSchema.parse(input);
  const clubId = await resolveClubId(parsed.club, parsed.competition);
  const id = parsed.id ?? crypto.randomUUID();
  const { error } = await client.from("players").upsert({
    id,
    name: parsed.name,
    position: parsed.position,
    club_id: clubId,
    category_id: parsed.category,
    competition: parsed.competition,
    season: 2026,
    tournament: "clausura",
    goals: parsed.goals,
    assists: parsed.assists,
    appearances: parsed.appearances,
    yellow_cards: parsed.yellowCards,
    red_cards: parsed.redCards,
    updated_by: user.id,
  }, { onConflict: "id" });
  if (error) throw error;
  return id;
}

export async function deletePlayer(playerId: string, user: User) {
  const client = await requireStaff(user);
  const { error } = await client.from("players").delete().eq("id", playerId);
  if (error) throw error;
}

function safeSegment(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadTeamPhotos(input: { files: File[]; competition: Competition; category: CategoryId; club: string }, user: User) {
  const client = await requireStaff(user);
  if (!input.files.length) throw new Error("Selecciona al menos una foto.");
  const invalid = input.files.find((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);
  if (invalid) throw new Error("Cada archivo debe ser una imagen de hasta 10 MB.");
  const clubId = await resolveClubId(input.club, input.competition);
  const uploaded: TeamPhoto[] = [];

  for (const [index, file] of input.files.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const id = crypto.randomUUID();
    const storagePath = `team-galleries/${input.competition}/${input.category}/${safeSegment(input.club)}/${id}.${extension}`;
    const { error: uploadError } = await client.storage.from("team-photos").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = client.storage.from("team-photos").getPublicUrl(storagePath);
    const photo: TeamPhoto = { id, competition: input.competition, category: input.category, club: input.club, url: publicUrl.publicUrl, storagePath, order: Date.now() + index };
    const { error: rowError } = await client.from("team_photos").insert({
      id,
      competition: input.competition,
      category_id: input.category,
      club_id: clubId,
      url: photo.url,
      storage_path: storagePath,
      sort_order: photo.order,
      created_by: user.id,
    });
    if (rowError) {
      await client.storage.from("team-photos").remove([storagePath]);
      throw rowError;
    }
    uploaded.push(photo);
  }
  return uploaded;
}

export async function deleteTeamPhoto(photo: TeamPhoto, user: User) {
  const client = await requireStaff(user);
  const { error: storageError } = await client.storage.from("team-photos").remove([photo.storagePath]);
  if (storageError) throw storageError;
  const { error } = await client.from("team_photos").delete().eq("id", photo.id);
  if (error) throw error;
}

export async function saveClub(input: { id?: string; name: string; aliases: string[]; logo: string; competitions: Competition[]; active: boolean }, user: User) {
  const client = await requireStaff(user);
  const name = input.name.trim();
  if (!name) throw new Error("El club necesita un nombre.");
  if (!input.competitions.length) throw new Error("Selecciona al menos una competencia.");
  const id = input.id ?? `club-${crypto.randomUUID()}`;
  const { error: clubError } = await client.from("clubs").upsert({
    id,
    name,
    aliases: input.aliases.map((alias) => alias.trim()).filter(Boolean),
    logo: input.logo.trim(),
    active: input.active,
  }, { onConflict: "id" });
  if (clubError) throw clubError;
  const { error: linkError } = await client.from("club_competitions").upsert(
    input.competitions.map((competition) => ({ club_id: id, competition })),
    { onConflict: "club_id,competition" },
  );
  if (linkError) throw linkError;
  return id;
}

export async function saveCategory(input: StaffCategory, user: User) {
  const client = await requireStaff(user);
  const { error } = await client.from("categories").upsert({
    id: input.id,
    name: input.name.trim(),
    birth_years: input.birthYears.trim(),
    sort_order: Math.max(0, Math.trunc(input.sortOrder)),
    active: input.active,
  }, { onConflict: "id" });
  if (error) throw error;
}
