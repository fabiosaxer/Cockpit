import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { addDays, todayISO } from "./dates";
import type { Absence, Area, IpaCandidate, Item, ItemType, Project, Referee, RefereeQuota } from "./types";

const DEFAULT_AREAS = [
  { code: "BUE", name: "Bühler", sort: 10 },
  { code: "ZHAW", name: "Studium", sort: 20 },
  { code: "IPA", name: "IPA-Experte", sort: 30 },
  { code: "FCZ", name: "FC Zuzwil", sort: 40 },
  { code: "OFV", name: "Schiedsrichter", sort: 50 },
  { code: "HOME", name: "Haushalt", sort: 60 },
];

const DEFAULT_TYPES = [
  { name: "Termin", lead_days: 0, sort: 10 },
  { name: "Aufgabe", lead_days: 2, sort: 20 },
  { name: "Projekt-Meilenstein", lead_days: 7, sort: 30 },
  { name: "Abgabe Studium", lead_days: 14, sort: 40 },
  { name: "Prüfung", lead_days: 28, sort: 50 },
  { name: "IPA-Korrektur", lead_days: 21, sort: 60 },
];

export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type Cockpit = {
  areas: Area[];
  types: ItemType[];
  items: Item[];
  projects: Project[];
  absences: Absence[];
  today: string;
};

/** Laedt alle offenen Daten. Beim ersten Login werden Bereiche und Typen angelegt. */
export async function loadCockpit(): Promise<Cockpit> {
  const { supabase } = await requireSession();

  const { count } = await supabase.from("areas").select("id", { count: "exact", head: true });
  if (!count) {
    await supabase.from("areas").insert(DEFAULT_AREAS);
    await supabase.from("item_types").insert(DEFAULT_TYPES);
  }

  const today = todayISO();
  const [areas, types, items, projects, absences] = await Promise.all([
    supabase.from("areas").select("*").order("sort"),
    supabase.from("item_types").select("*").order("sort"),
    supabase.from("items").select("*").is("done_at", null).order("due_date"),
    supabase.from("projects").select("*").is("archived_at", null).order("created_at"),
    supabase.from("absences").select("*").gte("end_date", addDays(today, -3)).order("start_date"),
  ]);

  for (const r of [areas, types, items, projects]) {
    if (r.error) throw new Error(r.error.message);
  }

  return {
    areas: areas.data as Area[],
    types: types.data as ItemType[],
    items: items.data as Item[],
    projects: projects.data as Project[],
    // Tabelle fehlt, solange die zweite Migration nicht ausgefuehrt ist: dann einfach leer
    absences: (absences.error ? [] : absences.data) as Absence[],
    today,
  };
}

export async function loadAbsences(): Promise<Absence[]> {
  const { supabase } = await requireSession();
  const { data, error } = await supabase
    .from("absences")
    .select("*")
    .gte("end_date", addDays(todayISO(), -60))
    .order("start_date");
  if (error) throw new Error(error.message);
  return data as Absence[];
}

export async function loadIpa(): Promise<{ candidates: IpaCandidate[]; points: Item[] }> {
  const { supabase } = await requireSession();
  const [c, p] = await Promise.all([
    supabase.from("ipa_candidates").select("*").order("start_date", { ascending: false }),
    supabase.from("items").select("*").not("ipa_candidate_id", "is", null).order("due_date"),
  ]);
  if (c.error) throw new Error(c.error.message);
  if (p.error) throw new Error(p.error.message);
  return { candidates: c.data as IpaCandidate[], points: p.data as Item[] };
}

export async function loadReferees(year: number): Promise<{ referees: Referee[]; quota: RefereeQuota[] }> {
  const { supabase } = await requireSession();
  const [r, q] = await Promise.all([
    supabase.from("referees").select("*").order("name"),
    supabase.from("referee_quota").select("*").eq("year", year),
  ]);
  if (r.error) throw new Error(r.error.message);
  if (q.error) throw new Error(q.error.message);
  return { referees: r.data as Referee[], quota: q.data as RefereeQuota[] };
}

export async function loadDone(areaId: string, limit = 10): Promise<Item[]> {
  const { supabase } = await requireSession();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("area_id", areaId)
    .not("done_at", "is", null)
    .order("done_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as Item[];
}

export async function loadItem(id: string): Promise<Item | null> {
  const { supabase } = await requireSession();
  const { data } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  return (data as Item) ?? null;
}
