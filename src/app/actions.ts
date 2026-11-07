"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/data";
import { addInterval, isISODate, todayISO } from "@/lib/dates";
import type { Item, ProjectStatus, RecurUnit } from "@/lib/types";

const RECUR_UNITS: RecurUnit[] = ["day", "week", "month", "year"];
const STATUSES: ProjectStatus[] = ["green", "amber", "red"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}
function optInt(fd: FormData, key: string, min = 0): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= min ? n : null;
}
function date(fd: FormData, key: string): string {
  const v = str(fd, key);
  if (!isISODate(v)) throw new Error("Ungültiges Datum");
  return v;
}
function optDate(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v && isISODate(v) ? v : null;
}
function safeBack(fd: FormData): string {
  const b = str(fd, "back");
  return b.startsWith("/") && !b.startsWith("//") ? b : "/";
}

function itemFields(fd: FormData) {
  const title = str(fd, "title");
  if (!title) throw new Error("Titel fehlt");
  const unit = str(fd, "recur_unit") as RecurUnit;
  const every = optInt(fd, "recur_every", 1);
  const recurring = every != null && RECUR_UNITS.includes(unit);
  return {
    title,
    area_id: str(fd, "area_id"),
    type_id: optStr(fd, "type_id"),
    project_id: optStr(fd, "project_id"),
    due_date: date(fd, "due_date"),
    lead_days: optInt(fd, "lead_days"),
    note: optStr(fd, "note"),
    recur_every: recurring ? every : null,
    recur_unit: recurring ? unit : null,
  };
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- Eintraege ----------

export async function createItem(fd: FormData) {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("items").insert(itemFields(fd));
  if (error) throw new Error(error.message);
  refresh();
}

export async function updateItem(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("items").update(itemFields(fd)).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
  redirect(safeBack(fd));
}

export async function deleteItem(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
  redirect(safeBack(fd));
}

/** Erledigt. Bei Wiederholung wird der naechste Eintrag ab heute (Erledigt-Datum) berechnet. */
export async function completeItem(id: string) {
  const { supabase } = await requireSession();
  const { data, error } = await supabase.from("items").select("*").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Nicht gefunden");
  const item = data as Item;
  if (item.done_at) return;

  const { error: upErr } = await supabase
    .from("items")
    .update({ done_at: new Date().toISOString() })
    .eq("id", id);
  if (upErr) throw new Error(upErr.message);

  if (item.recur_every && item.recur_unit) {
    const { error: insErr } = await supabase.from("items").insert({
      area_id: item.area_id,
      type_id: item.type_id,
      project_id: item.project_id,
      parent_id: item.id,
      title: item.title,
      note: item.note,
      lead_days: item.lead_days,
      recur_every: item.recur_every,
      recur_unit: item.recur_unit,
      due_date: addInterval(todayISO(), item.recur_every, item.recur_unit),
    });
    if (insErr) throw new Error(insErr.message);
  }
  refresh();
}

/** Rueckgaengig: wieder offen, eine automatisch erzeugte Folge wird entfernt. */
export async function restoreItem(id: string) {
  const { supabase } = await requireSession();
  await supabase.from("items").delete().eq("parent_id", id).is("done_at", null);
  const { error } = await supabase.from("items").update({ done_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- Projekte ----------

export async function createProject(fd: FormData) {
  const { supabase } = await requireSession();
  const title = str(fd, "title");
  if (!title) throw new Error("Titel fehlt");
  const { error } = await supabase.from("projects").insert({
    title,
    area_id: str(fd, "area_id"),
    next_step: optStr(fd, "next_step"),
    next_milestone: optDate(fd, "next_milestone"),
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function updateProject(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const status = str(fd, "status") as ProjectStatus;
  const { error } = await supabase
    .from("projects")
    .update({
      title: str(fd, "title") || undefined,
      status: STATUSES.includes(status) ? status : undefined,
      next_step: optStr(fd, "next_step"),
      next_milestone: optDate(fd, "next_milestone"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function setProjectStatus(id: string, status: ProjectStatus) {
  if (!STATUSES.includes(status)) return;
  const { supabase } = await requireSession();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function archiveProject(id: string) {
  const { supabase } = await requireSession();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- Einstellungen ----------

export async function updateTypeLead(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const lead = optInt(fd, "lead_days");
  const name = str(fd, "name");
  if (lead == null || !name) return;
  const { error } = await supabase.from("item_types").update({ lead_days: lead, name }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function createType(fd: FormData) {
  const { supabase } = await requireSession();
  const name = str(fd, "name");
  const lead = optInt(fd, "lead_days") ?? 0;
  if (!name) return;
  const { error } = await supabase.from("item_types").insert({ name, lead_days: lead, sort: 100 });
  if (error) throw new Error(error.message);
  refresh();
}

export async function renameArea(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const name = str(fd, "name");
  if (!name) return;
  const { error } = await supabase.from("areas").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
