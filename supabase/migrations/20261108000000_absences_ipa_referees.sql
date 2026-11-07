-- Stufe 2: Abwesenheiten, IPA-Kandidaten, Schiedsrichter-Kontingent

-- Abwesenheiten (Geschaeftsreisen, Ferien)
create table public.absences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Abwesend',
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index absences_dates_idx on public.absences (user_id, end_date);

-- IPA-Kandidaten: nur Kuerzel und Daten, keine Personendaten
create table public.ipa_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  start_date date not null,
  end_date date not null,
  presentation_date date,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- Fixpunkte einer IPA sind normale Eintraege, verknuepft mit dem Kandidaten
alter table public.items
  add column ipa_candidate_id uuid references public.ipa_candidates(id) on delete cascade;
create index items_ipa_idx on public.items (ipa_candidate_id);

-- Schiedsrichter des Vereins (verein) und Mini-Schiedsrichter (mini)
create table public.referees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'verein' check (kind in ('verein', 'mini')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Geleitete Spiele, gezaehlt pro Kalenderjahr
create table public.referee_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  referee_id uuid not null references public.referees(id) on delete cascade,
  game_date date not null,
  note text,
  created_at timestamptz not null default now()
);
create index referee_games_idx on public.referee_games (referee_id, game_date);

alter table public.absences enable row level security;
alter table public.ipa_candidates enable row level security;
alter table public.referees enable row level security;
alter table public.referee_games enable row level security;

create policy "own absences" on public.absences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own ipa_candidates" on public.ipa_candidates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own referees" on public.referees
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own referee_games" on public.referee_games
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
