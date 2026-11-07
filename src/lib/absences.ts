import { addDays } from "./dates";
import type { Absence } from "./types";

export function absenceAt(iso: string, absences: Absence[]): Absence | undefined {
  return absences.find((a) => a.start_date <= iso && iso <= a.end_date);
}

/** Verschiebt ein Datum auf den ersten Tag nach einer (oder mehreren aufeinanderfolgenden) Abwesenheiten. */
export function shiftOutOfAbsences(iso: string, absences: Absence[]): string {
  let d = iso;
  for (let i = 0; i < 50; i++) {
    const a = absenceAt(d, absences);
    if (!a) return d;
    d = addDays(a.end_date, 1);
  }
  return d;
}

/** Fixe Frist waehrend oder kurz (bis 2 Tage) nach einer Abwesenheit? */
export function absenceConflict(due: string, absences: Absence[], bufferDays = 2): Absence | undefined {
  return absences.find((a) => a.start_date <= due && due <= addDays(a.end_date, bufferDays));
}
