import { diffDays } from "./dates";
import type { Item, ItemType, RecurUnit } from "./types";

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

export type ClassifiedItem = Item & { state: ItemState; days: number; lead: number };

export function classifyAll(items: Item[], types: ItemType[], today: string): ClassifiedItem[] {
  return items
    .map((item) => {
      const lead = effectiveLead(item, types);
      return { ...item, lead, ...classify(item, lead, today) };
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
