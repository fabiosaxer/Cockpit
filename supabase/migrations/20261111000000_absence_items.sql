-- Mitnehmen-Liste (Checkliste) pro Abwesenheit
create table public.absence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  absence_id uuid not null references public.absences(id) on delete cascade,
  title text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index absence_items_absence_idx on public.absence_items (absence_id);

alter table public.absence_items enable row level security;
create policy "own absence_items" on public.absence_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
