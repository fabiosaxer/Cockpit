-- IPA: Beruf (Informatiker/in EFZ oder ICT-Fachmann/-frau EFZ)
alter table public.ipa_candidates
  add column if not exists profession text not null default 'informatiker'
  check (profession in ('informatiker', 'ict'));

-- Kontingent: kein Spielzaehler mehr, nur noch erreicht ja/nein pro Schiedsrichter und Kalenderjahr
drop table if exists public.referee_games;

create table public.referee_quota (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  referee_id uuid not null references public.referees(id) on delete cascade,
  year int not null,
  reached boolean not null default false,
  created_at timestamptz not null default now(),
  unique (referee_id, year)
);

alter table public.referee_quota enable row level security;
create policy "own referee_quota" on public.referee_quota
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
