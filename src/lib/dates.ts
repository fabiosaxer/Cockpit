import type { RecurUnit } from "./types";

export const TIME_ZONE = "Europe/Zurich";

/** Heutiges Datum in Zuerich als YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return toISO(new Date(Date.UTC(ny, nm, Math.min(d, lastDay))));
}

/** a - b in Tagen. */
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(a).getTime() - toUTC(b).getTime()) / 86_400_000);
}

export function addInterval(iso: string, every: number, unit: RecurUnit): string {
  switch (unit) {
    case "day":
      return addDays(iso, every);
    case "week":
      return addDays(iso, every * 7);
    case "month":
      return addMonths(iso, every);
    case "year":
      return addMonths(iso, every * 12);
  }
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUTC(value).getTime());
}

const shortFmt = new Intl.DateTimeFormat("de-CH", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

/** z.B. "Mo., 09.11." */
export function formatShort(iso: string): string {
  return shortFmt.format(toUTC(iso));
}

const longFmt = new Intl.DateTimeFormat("de-CH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatLong(iso: string): string {
  return longFmt.format(toUTC(iso));
}
