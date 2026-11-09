-- Eigene Reihenfolge in der Heute-Liste (per Ziehen), ohne sichtbare Nummerierung
alter table public.items add column if not exists today_order int;
