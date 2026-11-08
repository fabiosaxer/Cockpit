/** Mannschaften, die ein Vereins-SR mit erreichtem Kontingent sichert. */
export const TEAMS_PER_REFEREE = 2;
/** Spiele pro Kalenderjahr fuer bestehende SR. */
export const GAMES_REGULAR = 15;
/** Spiele im Fruehling fuer Neulinge (Kurs im Winter/Fruehling). */
export const GAMES_NEWCOMER = 5;

export type QuotaStatus = "open" | "on_track" | "paused" | "reached";

export const QUOTA_STATUS: { value: QuotaStatus; label: string; color: string }[] = [
  { value: "open", label: "Offen", color: "#6a83a0" },
  { value: "on_track", label: "Auf Kurs", color: "#0b8ad6" },
  { value: "paused", label: "Pausiert", color: "#e08600" },
  { value: "reached", label: "Erreicht", color: "#12a26a" },
];

/** Saison, fuer die ein Kalenderjahr zaehlt: 2026 -> "2027/28" */
export function seasonFor(year: number): string {
  return `${year + 1}/${String(year + 2).slice(-2)}`;
}

export type QuotaBalance = {
  target: number | null;
  secured: number;
  onTrack: number;
  open: number;
  paused: number;
  /** Mannschaften, wenn alle "Auf Kurs" es schaffen */
  projected: number;
  /** fehlende Mannschaften zum Ziel (nach Prognose), 0 wenn erreicht */
  missingTeams: number;
  /** so viele zusaetzliche SR (bzw. Neulinge) braeuchte es */
  missingReferees: number;
};

/** Bilanz einer Saison aus den Status der Vereins-SR und dem Ziel. */
export function quotaBalance(statuses: QuotaStatus[], target: number | null): QuotaBalance {
  const count = (s: QuotaStatus) => statuses.filter((x) => x === s).length;
  const secured = count("reached") * TEAMS_PER_REFEREE;
  const onTrack = count("on_track") * TEAMS_PER_REFEREE;
  const projected = secured + onTrack;
  const missingTeams = target == null ? 0 : Math.max(0, target - projected);
  return {
    target,
    secured,
    onTrack,
    open: count("open"),
    paused: count("paused"),
    projected,
    missingTeams,
    missingReferees: Math.ceil(missingTeams / TEAMS_PER_REFEREE),
  };
}
