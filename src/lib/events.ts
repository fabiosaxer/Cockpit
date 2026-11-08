import type { Area, CalendarCategory, Item } from "./types";

/** Minimal benoetigte Felder eines Outlook-Termins (siehe outlook.ts). */
export type EventInput = {
  id: string;
  subject: string;
  isAllDay: boolean;
  categories: string[];
  webLink: string | null;
  start: { dateTime: string };
};

/** Standard-Zuordnung beim ersten Verbinden: Outlook-Kategorie -> Bereichscode, Vorlauf */
export const DEFAULT_CATEGORY_MAP: { category: string; code: string; lead: number }[] = [
  { category: "FC Zuzwil", code: "FCZ", lead: 2 },
  { category: "Schiedsrichter", code: "OFV", lead: 0 },
  { category: "IPA", code: "IPA", lead: 2 },
  { category: "Studium", code: "ZHAW", lead: 0 },
  { category: "Leistungsnachweise", code: "ZHAW", lead: 14 },
  { category: "Militär", code: "PRIV", lead: 14 },
  { category: "FCSG", code: "PRIV", lead: 0 },
  { category: "", code: "PRIV", lead: 0 },
];

/**
 * Wandelt Outlook-Termine in Eintraege um, damit sie wie Aufgaben klassifiziert werden.
 * Die erste zugeordnete Kategorie gewinnt; ohne Zuordnung gilt die Regel fuer "" (ohne Kategorie).
 */
export function eventsToItems(events: EventInput[], categories: CalendarCategory[], areas: Area[]): Item[] {
  const byName = new Map(categories.map((c) => [c.category.toLowerCase(), c]));
  const fallback = byName.get("");
  const fallbackArea = fallback?.area_id ?? areas.find((a) => a.code === "PRIV")?.id ?? areas[0]?.id;

  const items: Item[] = [];
  for (const e of events) {
    const rule = e.categories.map((c) => byName.get(c.toLowerCase())).find(Boolean) ?? fallback;
    if (rule?.hidden) continue;
    const areaId = rule?.area_id ?? fallbackArea;
    if (!areaId) continue;
    items.push({
      id: `ev:${e.id}`,
      area_id: areaId,
      type_id: null,
      project_id: null,
      parent_id: null,
      title: e.subject || "(ohne Titel)",
      due_date: e.start.dateTime.slice(0, 10),
      lead_days: rule?.lead_days ?? 0,
      note: null,
      recur_every: null,
      recur_unit: null,
      done_at: null,
      event: { time: e.isAllDay ? null : e.start.dateTime.slice(11, 16), webLink: e.webLink },
    });
  }
  return items;
}
