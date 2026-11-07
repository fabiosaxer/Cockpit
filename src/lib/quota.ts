import { addDays, weekday } from "./dates";

export const QUOTA = 15;

/** Samstage von heute (inkl.) bis Jahresende. */
export function weekendsLeft(today: string): number {
  const end = `${today.slice(0, 4)}-12-31`;
  let n = 0;
  for (let d = today; d <= end; d = addDays(d, 1)) if (weekday(d) === 6) n++;
  return n;
}

export type QuotaState = "reached" | "ok" | "tight" | "critical";

/**
 * Einschaetzung pro Schiedsrichter fuer das laufende Jahr.
 * Faustregel: mehr als 1 Spiel pro verbleibendem Wochenende ist knapp, mehr als 2 kaum machbar.
 * Fuer vergangene Jahre zaehlt nur erreicht / nicht erreicht.
 */
export function quotaStatus(count: number, today: string, year: number) {
  const remaining = Math.max(0, QUOTA - count);
  const currentYear = Number(today.slice(0, 4));
  if (remaining === 0) return { remaining, state: "reached" as QuotaState, weekends: 0 };
  if (year < currentYear) return { remaining, state: "critical" as QuotaState, weekends: 0 };
  const weekends = year > currentYear ? 52 : weekendsLeft(today);
  const perWeekend = remaining / Math.max(weekends, 1);
  const state: QuotaState = perWeekend > 2 ? "critical" : perWeekend > 1 ? "tight" : "ok";
  return { remaining, state, weekends };
}

/** Saison, fuer die ein Jahr zaehlt: 2026 -> "2027/28" */
export function seasonFor(year: number): string {
  return `${year + 1}/${String(year + 2).slice(-2)}`;
}
