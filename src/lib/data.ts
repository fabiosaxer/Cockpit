import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { todayISO } from "./dates";
import type { Area, Item, ItemType, Project } from "./types";

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

  const [areas, types, items, projects] = await Promise.all([
    supabase.from("areas").select("*").order("sort"),
    supabase.from("item_types").select("*").order("sort"),
    supabase.from("items").select("*").is("done_at", null).order("due_date"),
    supabase.from("projects").select("*").is("archived_at", null).order("created_at"),
  ]);

  for (const r of [areas, types, items, projects]) {
    if (r.error) throw new Error(r.error.message);
  }

  return {
    areas: areas.data as Area[],
    types: types.data as ItemType[],
    items: items.data as Item[],
    projects: projects.data as Project[],
    today: todayISO(),
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
