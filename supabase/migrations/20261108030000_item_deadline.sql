-- Kritische Termine: echte Frist (deadline); die Faelligkeit (due_date) liegt eine Woche davor
alter table public.items add column if not exists deadline date;
