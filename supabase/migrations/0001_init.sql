-- Skolesaus: innlogging, profil og poengsystem
-- Kjør denne migrasjonen i Supabase (SQL Editor, eller `supabase db push`
-- hvis du bruker Supabase CLI lokalt). Se INNLOGGING_PLAN.md og
-- SUPABASE_SETUP.md for kontekst.

-- ─── profiles ──────────────────────────────────────────────────────────
-- Én rad per bruker. Opprettes automatisk av trigger ved registrering
-- (se handle_new_user under), aldri direkte fra klienten.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_base text not null default 'fox',
  avatar_color text not null default '#43d4b2',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiler er offentlig lesbare"
  on public.profiles for select
  using (true);

create policy "Bruker kan oppdatere egen profil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── games ─────────────────────────────────────────────────────────────
-- Statisk liste over spill. Rader legges inn manuelt (se seed under),
-- ikke skrivbar fra klienten.
create table if not exists public.games (
  id text primary key,
  display_name text not null
);

alter table public.games enable row level security;

create policy "Spillisten er offentlig lesbar"
  on public.games for select
  using (true);

insert into public.games (id, display_name) values
  ('fruktspleis', 'Fruktspleis'),
  ('kloss-spreng', 'Kloss Spreng'),
  ('tallkombo', 'Tallkombo')
on conflict (id) do nothing;

-- ─── game_scores ───────────────────────────────────────────────────────
-- Aggregat: highscore + totalpoeng + antall runder per bruker/spill.
-- Skrives KUN av trigger'en under (aldri direkte insert/update fra klienten).
create table if not exists public.game_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null references public.games (id),
  highscore integer not null default 0,
  total_points integer not null default 0,
  rounds_played integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.game_scores enable row level security;

create policy "Poengsummer er offentlig lesbare"
  on public.game_scores for select
  using (true);

-- Ingen insert/update/delete-policy for game_scores → klienten kan ikke
-- skrive til denne tabellen i det hele tatt, kun lese. All skriving skjer
-- av triggeren under, som kjører med tabell-eierens rettigheter.

-- ─── game_rounds ───────────────────────────────────────────────────────
-- Rå-logg: én rad per fullførte runde. Dette er det ENESTE stedet
-- klienten selv får lov til å skrive poeng.
create table if not exists public.game_rounds (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null references public.games (id),
  points integer not null check (points >= 0 and points <= 1000000),
  played_at timestamptz not null default now()
);

alter table public.game_rounds enable row level security;

create policy "Bruker kan se egne runder"
  on public.game_rounds for select
  using (auth.uid() = user_id);

create policy "Bruker kan rapportere egne runder"
  on public.game_rounds for insert
  with check (auth.uid() = user_id);

-- Ingen update/delete-policy → en rapportert runde kan ikke endres eller
-- slettes av brukeren i ettertid.

-- ─── Trigger: opprett profil automatisk ved registrering ───────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Trigger: aggreger game_rounds inn i game_scores ────────────────────
-- Kjører server-side ved hver ny runde. Klienten kan ALDRI skrive
-- highscore/total_points direkte — kun poste en runde til game_rounds,
-- som denne funksjonen så regner sammen. Hindrer forfalskede poengsummer
-- fra dev-verktøy i nettleseren.
create or replace function public.handle_new_round()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.game_scores (user_id, game_id, highscore, total_points, rounds_played, updated_at)
  values (new.user_id, new.game_id, new.points, new.points, 1, now())
  on conflict (user_id, game_id) do update
    set highscore = greatest(public.game_scores.highscore, excluded.highscore),
        total_points = public.game_scores.total_points + new.points,
        rounds_played = public.game_scores.rounds_played + 1,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_game_round_inserted on public.game_rounds;
create trigger on_game_round_inserted
  after insert on public.game_rounds
  for each row execute function public.handle_new_round();
