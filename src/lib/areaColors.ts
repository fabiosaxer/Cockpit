/** Jede Kachel bekommt ihre eigene, froehliche Farbe. */
const AREA_COLORS: Record<string, string> = {
  BUE: "#0b8ad6",
  ZHAW: "#7c5cff",
  IPA: "#0fb3a6",
  FCZ: "#f97316",
  OFV: "#e2338a",
  HOME: "#e3a600",
};

const FALLBACK = ["#0b8ad6", "#7c5cff", "#0fb3a6", "#f97316", "#e2338a", "#e3a600"];

export function areaColor(code: string): string {
  if (AREA_COLORS[code]) return AREA_COLORS[code];
  const n = [...code].reduce((s, c) => s + c.charCodeAt(0), 0);
  return FALLBACK[n % FALLBACK.length];
}
