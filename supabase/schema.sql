-- Lifiweb Supabase target schema.
-- This file is intentionally kept as a reviewable schema draft until it has been
-- executed against the connected Supabase project and verified. Do not delete
-- Firebase/Firestore data or the local JSON fallbacks before verification passes.

begin;

create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  birth_years text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id text primary key,
  name text not null,
  aliases text[] not null default '{}',
  logo text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_competitions (
  club_id text not null references public.clubs(id) on update cascade on delete restrict,
  competition text not null check (competition in ('league', 'cup', 'lff')),
  primary key (club_id, competition)
);

create table if not exists public.players (
  id text primary key,
  name text not null check (char_length(trim(name)) between 2 and 100),
  position text not null default 'Jugador',
  club_id text not null references public.clubs(id) on update cascade on delete restrict,
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  competition text not null check (competition in ('league', 'cup', 'lff')),
  season integer not null default 2026 check (season >= 2000),
  tournament text not null default 'clausura' check (tournament in ('clausura')),
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  appearances integer not null default 0 check (appearances >= 0),
  yellow_cards integer not null default 0 check (yellow_cards >= 0),
  red_cards integer not null default 0 check (red_cards >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists players_competition_category_idx
  on public.players (competition, category_id);
create index if not exists players_club_idx on public.players (club_id);

create table if not exists public.matches (
  id text primary key,
  season integer not null default 2026 check (season >= 2000),
  tournament text not null default 'clausura' check (tournament in ('clausura')),
  competition text not null check (competition in ('league', 'cup', 'lff')),
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  round integer not null check (round >= 1),
  round_label text,
  sort_order integer not null default 99 check (sort_order >= 0),
  home_club_id text not null references public.clubs(id) on update cascade on delete restrict,
  away_club_id text not null references public.clubs(id) on update cascade on delete restrict,
  home_score integer check (home_score is null or home_score >= 0),
  away_score integer check (away_score is null or away_score >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'played', 'postponed', 'cancelled')),
  match_date text,
  match_time text,
  venue text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint matches_distinct_clubs check (home_club_id <> away_club_id),
  constraint matches_scores_match_status check (
    (status = 'played' and home_score is not null and away_score is not null)
    or
    (status <> 'played' and home_score is null and away_score is null)
  )
);

create index if not exists matches_competition_category_round_idx
  on public.matches (competition, category_id, round, sort_order);

create table if not exists public.team_photos (
  id text primary key,
  competition text not null check (competition in ('league', 'cup', 'lff')),
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  club_id text not null references public.clubs(id) on update cascade on delete restrict,
  url text not null,
  storage_path text not null,
  sort_order bigint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists team_photos_lookup_idx
  on public.team_photos (competition, category_id, club_id, sort_order);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Keep updated_at server-controlled.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
grant execute on function public.set_updated_at() to authenticated, service_role;

drop trigger if exists staff_users_set_updated_at on public.staff_users;
create trigger staff_users_set_updated_at before update on public.staff_users
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at before update on public.clubs
for each row execute function public.set_updated_at();

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

-- RLS is required for every public-schema table exposed through the Data API.
alter table public.staff_users enable row level security;
alter table public.categories enable row level security;
alter table public.clubs enable row level security;
alter table public.club_competitions enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.team_photos enable row level security;
alter table public.app_settings enable row level security;

-- An authenticated user may only see their own staff-role row. No client may
-- insert/update/delete staff roles; those are provisioned out-of-band by an admin.
drop policy if exists "staff can read own role" on public.staff_users;
create policy "staff can read own role"
on public.staff_users for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_users
    where user_id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated, service_role;

-- Explicit API grants. RLS still determines which rows are accessible.
grant select on public.categories, public.clubs, public.club_competitions,
  public.players, public.matches, public.team_photos, public.app_settings
  to anon, authenticated;

grant insert, update, delete on public.categories, public.clubs,
  public.club_competitions, public.players, public.matches,
  public.team_photos, public.app_settings
  to authenticated;

grant select on public.staff_users to authenticated;

-- Public data: anyone may read; only an authorized Staff account may mutate.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'categories', 'clubs', 'club_competitions', 'players',
    'matches', 'team_photos', 'app_settings'
  ]
  loop
    execute format('drop policy if exists "public read" on public.%I', table_name);
    execute format(
      'create policy "public read" on public.%I for select to anon, authenticated using (true)',
      table_name
    );

    execute format('drop policy if exists "staff insert" on public.%I', table_name);
    execute format(
      'create policy "staff insert" on public.%I for insert to authenticated with check (public.is_staff())',
      table_name
    );

    execute format('drop policy if exists "staff update" on public.%I', table_name);
    execute format(
      'create policy "staff update" on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())',
      table_name
    );

    execute format('drop policy if exists "staff delete" on public.%I', table_name);
    execute format(
      'create policy "staff delete" on public.%I for delete to authenticated using (public.is_staff())',
      table_name
    );
  end loop;
end
$$;

-- Public gallery bucket. Existing static files can remain in /public during the
-- migration; new Staff uploads should use this bucket after cutover.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-photos',
  'team-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "staff upload team photos" on storage.objects;
create policy "staff upload team photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'team-photos' and public.is_staff());

drop policy if exists "staff update team photos" on storage.objects;
create policy "staff update team photos"
on storage.objects for update
to authenticated
using (bucket_id = 'team-photos' and public.is_staff())
with check (bucket_id = 'team-photos' and public.is_staff());

drop policy if exists "staff delete team photos" on storage.objects;
create policy "staff delete team photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'team-photos' and public.is_staff());

insert into public.app_settings (key, value)
values
  ('season', '2026'::jsonb),
  ('active_tournament', '"clausura"'::jsonb)
on conflict (key) do update set value = excluded.value;

commit;
