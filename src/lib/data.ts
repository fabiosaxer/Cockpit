import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { addDays, todayISO } from "./dates";
import type { Absence, AbsenceItem, Area, IpaCandidate, Item, ItemType, Project, Referee, RefereeQuota, CalendarCategory, StudyModule } from "./types";

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
  /** Alle Meilensteine (offen und erledigt) aktiver Projekte */
  milestones: Item[];
  modules: StudyModule[];
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
  const [areas, types, items, projects, absences, milestones, modules] = await Promise.all([
    supabase.from("areas").select("*").order("sort"),
    supabase.from("item_types").select("*").order("sort"),
    supabase.from("items").select("*").is("done_at", null).order("due_date"),
    supabase.from("projects").select("*").is("archived_at", null).order("created_at"),
    supabase.from("absences").select("*").gte("end_date", addDays(today, -3)).order("start_date"),
    supabase.from("items").select("*").not("project_id", "is", null).order("due_date"),
    supabase.from("study_modules").select("*").is("archived_at", null).order("sort"),
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
    milestones: (milestones.data ?? []) as Item[],
    modules: (modules.error ? [] : modules.data) as StudyModule[],
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

export async function loadReferees(year: number): Promise<{
  referees: Referee[];
  quota: RefereeQuota[];
  target: number | null;
  /** SR mit Eintraegen in frueheren Jahren: koennen keine Neulinge sein */
  veterans: Set<string>;
}> {
  const { supabase } = await requireSession();
  const [r, q, t, prev] = await Promise.all([
    supabase.from("referees").select("*").order("name"),
    supabase.from("referee_quota").select("*").eq("year", year),
    supabase.from("referee_season_target").select("teams").eq("year", year).maybeSingle(),
    supabase.from("referee_quota").select("referee_id").lt("year", year).neq("status", "open"),
  ]);
  if (r.error) throw new Error(r.error.message);
  if (q.error) throw new Error(q.error.message);
  if (t.error) throw new Error(t.error.message);
  return {
    referees: r.data as Referee[],
    quota: q.data as RefereeQuota[],
    target: (t.data?.teams as number | undefined) ?? null,
    veterans: new Set((prev.data ?? []).map((x) => x.referee_id as string)),
  };
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

export type OutlookStatus = "off" | "disconnected" | "ok" | "relogin" | "error";

/** Outlook-Termine als Eintraege. Fehler fuehren nie zum Absturz der Seite. */
export async function loadOutlookItems(areas: Area[]): Promise<{ status: OutlookStatus; items: Item[] }> {
  const { outlookConfigured, getAccessToken, fetchEvents, OutlookAuthError } = await import("./outlook");
  const { eventsToItems } = await import("./events");
  if (!outlookConfigured()) return { status: "off", items: [] };
  const { supabase } = await requireSession();
  try {
    const token = await getAccessToken(supabase);
    if (!token) return { status: "disconnected", items: [] };
    const today = todayISO();
    const [events, cats] = await Promise.all([
      fetchEvents(token, today, addDays(today, 90)),
      supabase.from("calendar_categories").select("*"),
    ]);
    const items = eventsToItems(events, (cats.data ?? []) as CalendarCategory[], areas).map((i) =>
      // Mehrtaegige Termine, die vor heute begonnen haben, laufen heute noch
      i.due_date < today ? { ...i, due_date: today } : i,
    );
    return { status: "ok", items };
  } catch (e) {
    console.error("Outlook:", e);
    return { status: e instanceof OutlookAuthError ? "relogin" : "error", items: [] };
  }
}

/** Grundlage fuer den Unfallfrei-Zaehler: erledigte Eintraege des letzten Jahres und der erste Eintrag. */
export async function loadOverdueHistory(): Promise<{
  done: { due_date: string; done_date: string }[];
  firstDay: string | null;
}> {
  const { supabase } = await requireSession();
  const since = addDays(todayISO(), -400);
  const [done, first] = await Promise.all([
    supabase.from("items").select("due_date, done_at").not("done_at", "is", null).gte("due_date", since),
    supabase.from("items").select("created_at").order("created_at").limit(1),
  ]);
  const toDay = (ts: string) => todayISO(new Date(ts));
  return {
    done: (done.data ?? []).map((d) => ({ due_date: d.due_date as string, done_date: toDay(d.done_at as string) })),
    firstDay: first.data?.[0] ? toDay(first.data[0].created_at as string) : null,
  };
}

/** Eine Abwesenheit mit Mitnehmen-Liste und frueheren Abwesenheiten (zum Uebernehmen ihrer Liste). */
export async function loadAbsence(id: string): Promise<{
  absence: Absence;
  items: AbsenceItem[];
  previous: (Absence & { count: number })[];
} | null> {
  const { supabase } = await requireSession();
  const { data: absence } = await supabase.from("absences").select("*").eq("id", id).maybeSingle();
  if (!absence) return null;
  const [items, others, counts] = await Promise.all([
    supabase.from("absence_items").select("*").eq("absence_id", id).order("created_at"),
    supabase.from("absences").select("*").neq("id", id).order("start_date", { ascending: false }).limit(20),
    supabase.from("absence_items").select("absence_id"),
  ]);
  const countBy = new Map<string, number>();
  for (const r of counts.data ?? []) countBy.set(r.absence_id, (countBy.get(r.absence_id) ?? 0) + 1);
  return {
    absence: absence as Absence,
    items: (items.data ?? []) as AbsenceItem[],
    previous: ((others.data ?? []) as Absence[])
      .map((a) => ({ ...a, count: countBy.get(a.id) ?? 0 }))
      .filter((a) => a.count > 0),
  };
}

/** Packstand pro Abwesenheit: eingepackt / total. Leer, falls die Tabelle noch fehlt. */
export async function loadPackCounts(ids: string[]): Promise<Record<string, { done: number; total: number }>> {
  if (!ids.length) return {};
  const { supabase } = await requireSession();
  const { data, error } = await supabase.from("absence_items").select("absence_id, checked").in("absence_id", ids);
  if (error) return {};
  const out: Record<string, { done: number; total: number }> = {};
  for (const r of data ?? []) {
    const c = (out[r.absence_id] ??= { done: 0, total: 0 });
    c.total++;
    if (r.checked) c.done++;
  }
  return out;
}
