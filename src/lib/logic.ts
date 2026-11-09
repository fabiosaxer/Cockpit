import { absenceConflict } from "./absences";
import { addDays, addInterval, diffDays } from "./dates";
import type { Absence, Item, ItemType, RecurUnit } from "./types";

export type ItemState = "overdue" | "today" | "approach" | "later" | "done";

export const STATE_RANK: Record<ItemState, number> = {
  overdue: 0,
  today: 1,
  approach: 2,
  later: 3,
  done: 4,
};

/** Vorlauf: Wert am Eintrag hat Vorrang, sonst Standard des Typs, sonst 0. */
export function effectiveLead(item: Pick<Item, "lead_days" | "type_id">, types: ItemType[]): number {
  if (item.lead_days != null) return item.lead_days;
  return types.find((t) => t.id === item.type_id)?.lead_days ?? 0;
}

export function classify(
  item: Pick<Item, "due_date" | "done_at">,
  lead: number,
  today: string,
): { state: ItemState; days: number } {
  const days = diffDays(item.due_date, today);
  if (item.done_at) return { state: "done", days };
  if (days < 0) return { state: "overdue", days };
  if (days === 0) return { state: "today", days };
  if (days <= lead) return { state: "approach", days };
  return { state: "later", days };
}

/** Countdown im Stil eines Startablaufs: T-5, HEUTE, T+2. */
export function countdown(days: number): string {
  if (days === 0) return "HEUTE";
  return days > 0 ? `T-${days}` : `T+${-days}`;
}

export type ClassifiedItem = Item & {
  state: ItemState;
  days: number;
  lead: number;
  /** Fixe Frist waehrend oder kurz nach einer Abwesenheit */
  conflict?: Absence;
};

export function classifyAll(
  items: Item[],
  types: ItemType[],
  today: string,
  absences: Absence[] = [],
): ClassifiedItem[] {
  return items
    .map((item) => {
      const lead = effectiveLead(item, types);
      const conflict =
        !item.recur_every && !item.event && item.due_date >= today ? absenceConflict(item.due_date, absences) : undefined;
      return { ...item, lead, conflict, ...classify(item, lead, today) };
    })
    .sort(
      (a, b) =>
        STATE_RANK[a.state] - STATE_RANK[b.state] || a.due_date.localeCompare(b.due_date),
    );
}

const UNIT_LABEL: Record<RecurUnit, [string, string]> = {
  day: ["täglich", "Tage"],
  week: ["wöchentlich", "Wochen"],
  month: ["monatlich", "Monate"],
  year: ["jährlich", "Jahre"],
};

export function recurLabel(every: number | null, unit: RecurUnit | null): string | null {
  if (!every || !unit) return null;
  const [single, plural] = UNIT_LABEL[unit];
  return every === 1 ? single : `alle ${every} ${plural}`;
}

/** Puffer fuer kritische Termine: faellig eine Woche vor der echten Frist. */
export const CRITICAL_BUFFER_DAYS = 7;

/** Bereich, in dem Wiederholungen ab dem Erledigt-Datum rechnen. Ueberall sonst gilt ein fixer Rhythmus. */
export const RECUR_FROM_DONE_AREA = "HOME";

function isMonthEnd(iso: string): boolean {
  return addDays(iso, 1).slice(8, 10) === "01";
}

function toMonthEnd(iso: string): string {
  // erster Tag des Folgemonats minus 1 Tag
  const [y, m] = iso.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return addDays(next, -1);
}

/**
 * Naechste Faelligkeit einer wiederkehrenden Aufgabe.
 * fromDone: ab heute (Haushalt). Sonst fixer Rhythmus ab der bisherigen Faelligkeit,
 * bis das Datum nicht mehr in der Vergangenheit liegt. Monatsende bleibt Monatsende (28.2. -> 29.2.).
 */
export function nextDueDate(
  dueDate: string,
  every: number,
  unit: RecurUnit,
  today: string,
  fromDone: boolean,
): string {
  if (fromDone) return addInterval(today, every, unit);
  const monthly = unit === "month" || unit === "year";
  const keepEnd = monthly && isMonthEnd(dueDate);
  let next = dueDate;
  for (let i = 0; i < 1000; i++) {
    next = addInterval(next, every, unit);
    if (keepEnd) next = toMonthEnd(next);
    if (next > today) break;
  }
  return next;
}

/**
 * Tage ohne Ueberfaelliges ("unfallfrei").
 * Gezaehlt wird ab dem letzten Tag, an dem etwas verspaetet erledigt wurde, oder ab dem ersten Eintrag.
 * Ist jetzt etwas ueberfaellig, ist der Zaehler 0.
 */
export function overdueFreeDays(
  done: { due_date: string; done_date: string }[],
  overdueNow: boolean,
  today: string,
  firstDay: string | null,
): number {
  if (overdueNow) return 0;
  let last = firstDay;
  for (const d of done) {
    if (d.done_date > d.due_date && (!last || d.done_date > last)) last = d.done_date;
  }
  return last ? Math.max(0, diffDays(today, last)) : 0;
}

/**
 * Heute-Liste: bewusst eingeplante Eintraege plus alle Aufgaben, die heute faellig oder ueberfaellig sind.
 * Termine (Outlook und Typ "Termin") gehoeren nicht dazu, sie stehen im Zeitstrahl.
 */
export function todayTasks<T extends Item>(items: T[], types: ItemType[], today: string): T[] {
  const appointmentType = types.find((t) => t.name === "Termin")?.id;
  return items
    .filter(
      (i) =>
        !i.done_at &&
        !i.event &&
        ((i.planned_for != null && i.planned_for <= today) ||
          (i.due_date <= today && (appointmentType == null || i.type_id !== appointmentType))),
    )
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.title.localeCompare(b.title));
}
