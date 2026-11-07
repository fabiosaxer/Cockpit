/** Mannschaften, die ein Vereins-SR mit erreichtem Kontingent sichert. */
export const TEAMS_PER_REFEREE = 2;

/** Saison, fuer die ein Kalenderjahr zaehlt: 2026 -> "2027/28" */
export function seasonFor(year: number): string {
  return `${year + 1}/${String(year + 2).slice(-2)}`;
}
