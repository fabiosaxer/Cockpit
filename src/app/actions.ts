"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { shiftOutOfAbsences } from "@/lib/absences";
import { requireSession } from "@/lib/data";
import { addDays, addInterval, isISODate, todayISO } from "@/lib/dates";
import { CRITICAL_BUFFER_DAYS } from "@/lib/logic";
import { ipaSchedule } from "@/lib/ipa";
import type { Absence, Item, ProjectStatus, RecurUnit } from "@/lib/types";

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
  // Kritisch: Fälligkeit eine Woche vor der echten Frist
  const deadline = fd.get("critical") === "on" ? optDate(fd, "deadline") : null;
  return {
    title,
    area_id: str(fd, "area_id"),
    type_id: optStr(fd, "type_id"),
    project_id: optStr(fd, "project_id"),
    module_id: optStr(fd, "module_id"),
    deadline,
    due_date: deadline ? addDays(deadline, -CRITICAL_BUFFER_DAYS) : date(fd, "due_date"),
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

type Supabase = Awaited<ReturnType<typeof requireSession>>["supabase"];

async function activeAbsences(supabase: Supabase): Promise<Absence[]> {
  const { data, error } = await supabase.from("absences").select("*").gte("end_date", todayISO());
  return error ? [] : (data as Absence[]);
}

export async function createItem(fd: FormData) {
  const { supabase } = await requireSession();
  const fields = itemFields(fd);
  // Wiederkehrende Aufgaben nicht in eine Abwesenheit legen
  if (fields.recur_every) fields.due_date = shiftOutOfAbsences(fields.due_date, await activeAbsences(supabase));
  const { error } = await supabase.from("items").insert(fields);
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
      due_date: shiftOutOfAbsences(
        addInterval(todayISO(), item.recur_every, item.recur_unit),
        await activeAbsences(supabase),
      ),
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
  const { error } = await supabase.from("projects").insert({ title, area_id: str(fd, "area_id") });
  if (error) throw new Error(error.message);
  refresh();
}

export async function updateProject(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const title = str(fd, "title");
  if (!title) return;
  const { error } = await supabase.from("projects").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

/** Meilenstein = Eintrag vom Typ "Projekt-Meilenstein", verknuepft mit dem Projekt. */
export async function createMilestone(projectId: string, fd: FormData) {
  const { supabase } = await requireSession();
  const title = str(fd, "title");
  if (!title) throw new Error("Titel fehlt");
  const { data: project, error: pErr } = await supabase.from("projects").select("area_id").eq("id", projectId).single();
  if (pErr || !project) throw new Error(pErr?.message ?? "Projekt nicht gefunden");
  const { data: type } = await supabase.from("item_types").select("id").eq("name", "Projekt-Meilenstein").maybeSingle();
  const given = date(fd, "due_date");
  const critical = fd.get("critical") === "on";
  const { error } = await supabase.from("items").insert({
    title,
    deadline: critical ? given : null,
    due_date: critical ? addDays(given, -CRITICAL_BUFFER_DAYS) : given,
    area_id: project.area_id,
    project_id: projectId,
    type_id: type?.id ?? null,
  });
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

// ---------- Abwesenheiten ----------

/** Neue Abwesenheit. Offene wiederkehrende Aufgaben in diesem Zeitraum werden auf danach verschoben. */
export async function createAbsence(fd: FormData) {
  const { supabase } = await requireSession();
  const start = date(fd, "start_date");
  let end = date(fd, "end_date");
  if (end < start) end = start;
  const { error } = await supabase
    .from("absences")
    .insert({ title: str(fd, "title") || "Abwesend", start_date: start, end_date: end });
  if (error) throw new Error(error.message);

  const absences = await activeAbsences(supabase);
  const { data: affected } = await supabase
    .from("items")
    .select("id, due_date")
    .is("done_at", null)
    .not("recur_every", "is", null)
    .gte("due_date", start)
    .lte("due_date", end);
  for (const it of (affected ?? []) as Pick<Item, "id" | "due_date">[]) {
    await supabase
      .from("items")
      .update({ due_date: shiftOutOfAbsences(it.due_date, absences) })
      .eq("id", it.id);
  }
  refresh();
}

export async function deleteAbsence(id: string) {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("absences").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- IPA ----------

/** Neuer IPA-Kandidat: alle Fixpunkte werden als Eintraege im Bereich IPA angelegt. */
export async function createIpaCandidate(fd: FormData) {
  const { supabase } = await requireSession();
  const code = str(fd, "code").toUpperCase();
  if (!code) throw new Error("Kürzel fehlt");
  const start = date(fd, "start_date");
  const profession = str(fd, "profession") === "ict" ? "ict" : "informatiker";
  const end = profession === "ict" ? start : date(fd, "end_date");
  if (end < start) throw new Error("Ende liegt vor dem Start");
  const presentation = profession === "ict" ? null : optDate(fd, "presentation_date");

  const { data: cand, error } = await supabase
    .from("ipa_candidates")
    .insert({ code, profession, start_date: start, end_date: end, presentation_date: presentation })
    .select("id")
    .single();
  if (error || !cand) throw new Error(error?.message ?? "Speichern fehlgeschlagen");

  const [{ data: areas }, { data: types }] = await Promise.all([
    supabase.from("areas").select("id, code").order("sort"),
    supabase.from("item_types").select("id, name"),
  ]);
  const areaId = (areas ?? []).find((a) => a.code === "IPA")?.id ?? areas?.[0]?.id;
  const typeId = (name: string) => (types ?? []).find((t) => t.name === name)?.id ?? null;

  const rows = ipaSchedule(profession, code, start, end, presentation).map((p) => ({
    area_id: areaId,
    type_id: typeId(p.type),
    ipa_candidate_id: cand.id,
    title: p.title,
    due_date: p.date,
    lead_days: p.lead,
  }));
  const { error: insErr } = await supabase.from("items").insert(rows);
  if (insErr) throw new Error(insErr.message);
  refresh();
}

export async function deleteIpaCandidate(id: string) {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("ipa_candidates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- Schiedsrichter ----------

export async function createReferee(fd: FormData) {
  const { supabase } = await requireSession();
  const name = str(fd, "name");
  const kind = str(fd, "kind") === "mini" ? "mini" : "verein";
  if (!name) return;
  const { error } = await supabase.from("referees").insert({ name, kind });
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteReferee(id: string) {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("referees").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

/** Kontingent fuer ein Kalenderjahr als erreicht / nicht erreicht markieren. */
export async function setRefereeQuota(refereeId: string, year: number, reached: boolean) {
  const { supabase } = await requireSession();
  const { error } = await supabase
    .from("referee_quota")
    .upsert({ referee_id: refereeId, year, reached }, { onConflict: "referee_id,year" });
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- Outlook ----------

export async function disconnectOutlook() {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("oauth_tokens").delete().not("user_id", "is", null);
  if (error) throw new Error(error.message);
  refresh();
}

/** Zuordnung einer Outlook-Kategorie zu einem Bereich speichern. */
export async function saveCalendarCategory(fd: FormData) {
  const { supabase } = await requireSession();
  const { data: auth } = await supabase.auth.getUser();
  const areaId = str(fd, "area_id");
  const { error } = await supabase.from("calendar_categories").upsert(
    {
      user_id: auth.user?.id,
      category: str(fd, "category"),
      area_id: areaId && areaId !== "hidden" ? areaId : null,
      hidden: areaId === "hidden",
      lead_days: optInt(fd, "lead_days") ?? 0,
    },
    { onConflict: "user_id,category" },
  );
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- Studium: Faecher ----------

export async function createModule(fd: FormData) {
  const { supabase } = await requireSession();
  const name = str(fd, "name");
  if (!name) return;
  const { error } = await supabase
    .from("study_modules")
    .insert({ name, semester: optStr(fd, "semester"), sort: 100 });
  if (error) throw new Error(error.message);
  refresh();
}

export async function renameModule(id: string, fd: FormData) {
  const { supabase } = await requireSession();
  const name = str(fd, "name");
  if (!name) return;
  const { error } = await supabase.from("study_modules").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

/** Fach abschliessen (z.B. Semesterende): verschwindet aus Auswahl und Uebersicht. */
export async function archiveModule(id: string) {
  const { supabase } = await requireSession();
  const { error } = await supabase
    .from("study_modules")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
