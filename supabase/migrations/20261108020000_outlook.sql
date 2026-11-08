-- Outlook-Anbindung (Microsoft Graph, delegiert)

-- Tokens der Microsoft-Verbindung, verschluesselt (AES-256-GCM, Schluessel nur in Vercel)
create table public.oauth_tokens (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  provider text not null default 'microsoft',
  account text,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Zuordnung Outlook-Kategorie -> Bereich, mit Vorlauf
-- category '' steht fuer Termine ohne Kategorie
create table public.calendar_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  area_id uuid references public.areas(id) on delete set null,
  lead_days int not null default 0 check (lead_days >= 0),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.oauth_tokens enable row level security;
alter table public.calendar_categories enable row level security;

create policy "own oauth_tokens" on public.oauth_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own calendar_categories" on public.calendar_categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
