/**
 * Sonnenauf- und -untergang (vereinfachter NOAA/SunCalc-Algorithmus, Genauigkeit ca. 1-2 Minuten).
 * Standard-Ort: Zuzwil SG.
 */
const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2440588;
const J2000 = 2451545;
const E = RAD * 23.4397;
const J0 = 0.0009;

export const ZUZWIL = { lat: 47.474, lng: 9.108 };

const toJulian = (d: Date) => d.getTime() / DAY_MS - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY_MS);
const toDays = (d: Date) => toJulian(d) - J2000;
const declination = (l: number) => Math.asin(Math.sin(E) * Math.sin(l));
const meanAnomaly = (d: number) => RAD * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (m: number) =>
  m + RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) + RAD * 102.9372 + Math.PI;
const julianCycle = (d: number, lw: number) => Math.round(d - J0 - lw / (2 * Math.PI));
const approxTransit = (ht: number, lw: number, n: number) => J0 + (ht + lw) / (2 * Math.PI) + n;
const transitJ = (ds: number, m: number, l: number) => J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);
const hourAngle = (h: number, phi: number, d: number) =>
  Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

export function sunTimes(date: Date, lat = ZUZWIL.lat, lng = ZUZWIL.lng): { sunrise: Date; sunset: Date } {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const m = meanAnomaly(ds);
  const l = eclipticLongitude(m);
  const dec = declination(l);
  const noon = transitJ(ds, m, l);
  const w = hourAngle(-0.833 * RAD, phi, dec);
  const set = transitJ(approxTransit(w, lw, n), m, l);
  return { sunrise: fromJulian(noon - (set - noon)), sunset: fromJulian(set) };
}

export type SkyPhase = "night" | "dawn" | "day" | "golden" | "dusk";

export function skyPhase(now: Date, lat = ZUZWIL.lat, lng = ZUZWIL.lng): SkyPhase {
  const { sunrise, sunset } = sunTimes(now, lat, lng);
  const min = (a: Date) => (now.getTime() - a.getTime()) / 60_000;
  const r = min(sunrise);
  const s = min(sunset);
  if (r < -50 || s > 50) return "night";
  if (r < 40) return "dawn";
  if (s >= 10) return "dusk";
  if (s >= -60) return "golden";
  return "day";
}
