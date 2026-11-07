import { addDays, addWorkdays, diffDays, isWorkday, nextWorkday, workdaysBetween } from "./dates";

export type IpaProfession = "informatiker" | "ict";

export const PROFESSION_LABEL: Record<IpaProfession, string> = {
  informatiker: "Informatiker/in EFZ",
  ict: "ICT-Fachmann/-frau EFZ",
};

export type IpaPoint = {
  title: string;
  date: string;
  /** Typname fuer die Zuordnung */
  type: "Termin" | "IPA-Korrektur";
  lead: number | null;
};

function previousWorkday(iso: string): string {
  let d = iso;
  while (!isWorkday(d)) d = addDays(d, -1);
  return d;
}

/**
 * Fixpunkte einer IPA.
 * Informatiker/in EFZ: Validierungsgespraech ca. 2 Arbeitstage vor Start, Besuch 1 am 2. Arbeitstag,
 *   Besuch 2 etwa in der Mitte, Abgabe am Ende, Korrektur & Fachfragen bis 2 Arbeitstage vor der
 *   Praesentation (sichtbar ab Abgabe), Praesentation ca. 3 Wochen nach Abgabe.
 * ICT-Fachmann/-frau EFZ: nur Durchfuehrungstag (start) und Validierungsgespraech ca. eine Woche davor.
 */
export function ipaSchedule(
  profession: IpaProfession,
  code: string,
  start: string,
  end: string,
  presentation?: string | null,
): IpaPoint[] {
  if (profession === "ict") {
    return [
      { title: `IPA ${code}: Validierungsgespräch`, date: previousWorkday(addDays(start, -7)), type: "Termin", lead: 2 },
      { title: `IPA ${code}: Durchführungstag`, date: start, type: "Termin", lead: 3 },
    ];
  }

  const days = workdaysBetween(start, end);
  const visit1 = days[1] ?? start;
  const visit2 = days[Math.floor((days.length - 1) / 2)] ?? start;
  const pres = presentation ?? nextWorkday(addDays(end, 21));
  let correction = addWorkdays(pres, -2);
  if (correction < end) correction = end;

  return [
    { title: `IPA ${code}: Validierungsgespräch`, date: addWorkdays(start, -2), type: "Termin", lead: 2 },
    { title: `IPA ${code}: Besuch 1`, date: visit1, type: "Termin", lead: 2 },
    { title: `IPA ${code}: Besuch 2`, date: visit2, type: "Termin", lead: 2 },
    { title: `IPA ${code}: Abgabe`, date: end, type: "Termin", lead: 1 },
    { title: `IPA ${code}: Korrektur & Fachfragen`, date: correction, type: "IPA-Korrektur", lead: diffDays(correction, end) },
    { title: `IPA ${code}: Präsentation`, date: pres, type: "Termin", lead: 3 },
  ];
}
