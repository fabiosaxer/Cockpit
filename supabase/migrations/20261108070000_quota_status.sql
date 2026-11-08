-- Kontingent: Status statt ja/nein, Neulinge, Ziel pro Saison
-- year = Kalenderjahr, das fuer die Saison year+1/year+2 zaehlt.
-- Neulinge (Kurs im Winter/Fruehling, 5 Spiele) zaehlen ebenfalls fuer diese Saison.

alter table public.referee_quota
  add column if not exists status text not null default 'open'
    check (status in ('open', 'on_track', 'paused', 'reached')),
  add column if not exists note text,
  add column if not exists newcomer boolean not null default false;

update public.referee_quota set status = 'reached' where reached = true;
alter table public.referee_quota drop column if exists reached;

create table public.referee_season_target (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  year int not null,
  teams int not null check (teams >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, year)
);

alter table public.referee_season_target enable row level security;
create policy "own referee_season_target" on public.referee_season_target
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
