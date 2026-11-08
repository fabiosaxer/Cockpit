-- Studium: Faecher (Module) pro Semester, Eintraege koennen einem Fach zugeordnet werden
create table public.study_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  semester text,
  sort int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.study_modules enable row level security;
create policy "own study_modules" on public.study_modules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.items
  add column if not exists module_id uuid references public.study_modules(id) on delete set null;
create index if not exists items_module_idx on public.items (module_id);

-- Faecher Herbstsemester 2026 fuer den (einzigen) Benutzer
insert into public.study_modules (user_id, name, semester, sort)
select u.id, m.name, 'HS26', m.sort
from (select id from auth.users order by created_at limit 1) u,
     (values ('Ethik and Leadership', 10),
             ('VWL2', 20),
             ('Business Intelligence', 30),
             ('Doing Business in Asia Pacific', 40),
             ('WI-Projekt', 50)) as m(name, sort);
