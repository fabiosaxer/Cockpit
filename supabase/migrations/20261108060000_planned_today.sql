-- Heute-Liste: Eintraege bewusst fuer einen Tag einplanen (unabhaengig von der Faelligkeit)
alter table public.items add column if not exists planned_for date;
create index if not exists items_planned_idx on public.items (user_id, planned_for) where done_at is null;
