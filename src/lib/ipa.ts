import { addDays, addWorkdays, diffDays, nextWorkday, workdaysBetween } from "./dates";

export type IpaPoint = {
  key: "validation" | "visit1" | "visit2" | "submission" | "correction" | "presentation";
  title: string;
  date: string;
  /** Typname fuer die Zuordnung; Vorlauf null = Standard des Typs */
  type: "Termin" | "IPA-Korrektur";
  lead: number | null;
};

/**
 * Fixpunkte einer IPA (Informatiker/in EFZ):
 * Validierungsgespraech ca. 2 Arbeitstage vor Start, Besuch 1 am 2. Arbeitstag,
 * Besuch 2 etwa in der Mitte, Abgabe am Ende, Praesentation ca. 3 Wochen nach Abgabe.
 * Korrektur und Fachfragen muessen 2 Arbeitstage vor der Praesentation fertig sein, sichtbar ab Abgabe.
 */
export function ipaSchedule(code: string, start: string, end: string, presentation?: string | null): IpaPoint[] {
  const days = workdaysBetween(start, end);
  const visit1 = days[1] ?? start;
  const visit2 = days[Math.floor((days.length - 1) / 2)] ?? start;
  const pres = presentation ?? nextWorkday(addDays(end, 21));
  let correction = addWorkdays(pres, -2);
  if (correction < end) correction = end;

  return [
    { key: "validation", title: `IPA ${code}: Validierungsgespräch`, date: addWorkdays(start, -2), type: "Termin", lead: 2 },
    { key: "visit1", title: `IPA ${code}: Besuch 1`, date: visit1, type: "Termin", lead: 2 },
    { key: "visit2", title: `IPA ${code}: Besuch 2`, date: visit2, type: "Termin", lead: 2 },
    { key: "submission", title: `IPA ${code}: Abgabe`, date: end, type: "Termin", lead: 1 },
    {
      key: "correction",
      title: `IPA ${code}: Korrektur & Fachfragen`,
      date: correction,
      type: "IPA-Korrektur",
      lead: diffDays(correction, end),
    },
    { key: "presentation", title: `IPA ${code}: Präsentation`, date: pres, type: "Termin", lead: 3 },
  ];
}
