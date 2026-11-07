-- Cockpit: Grundschema (MVP)
-- Alle Tabellen gehoeren einem Benutzer (user_id) und sind per Row Level Security geschuetzt.

create extension if not exists pgcrypto;

-- Bereiche (Buehler, Studium, IPA, ...)
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

-- Typen mit Standard-Vorlauf in Tagen
create table public.item_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  lead_days int not null default 0 check (lead_days >= 0),
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Projekte im eigenen Lead
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  title text not null,
  status text not null default 'green' check (status in ('green', 'amber', 'red')),
  next_step text,
  next_milestone date,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- Aufgaben, Termine, Abgaben
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  type_id uuid references public.item_types(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  parent_id uuid references public.items(id) on delete set null,
  title text not null,
  due_date date not null,
  lead_days int check (lead_days >= 0),
  note text,
  recur_every int check (recur_every > 0),
  recur_unit text check (recur_unit in ('day', 'week', 'month', 'year')),
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index items_open_idx on public.items (user_id, done_at, due_date);
create index items_parent_idx on public.items (parent_id);
create index projects_area_idx on public.projects (area_id);

-- Row Level Security: jede Zeile nur fuer ihren Besitzer
alter table public.areas enable row level security;
alter table public.item_types enable row level security;
alter table public.projects enable row level security;
alter table public.items enable row level security;

create policy "own areas" on public.areas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own item_types" on public.item_types
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own projects" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own items" on public.items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
