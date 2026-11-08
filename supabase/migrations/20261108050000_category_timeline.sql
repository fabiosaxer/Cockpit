-- Pro Outlook-Kategorie steuern, ob Termine im Zeitstrahl erscheinen (z.B. Lektionen nicht)
alter table public.calendar_categories
  add column if not exists in_timeline boolean not null default true;

update public.calendar_categories set in_timeline = false where category = 'Studium';
