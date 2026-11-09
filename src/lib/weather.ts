import { ZUZWIL } from "./sun";

export type WeatherKind = "clear" | "partly" | "overcast" | "fog" | "rain" | "snow" | "thunder";

export type Weather = {
  kind: WeatherKind;
  temp: number;
  lat: number;
  lng: number;
  place: "device" | "default";
  at: number;
};

const CACHE_KEY = "cockpit.weather";
const MAX_AGE = 30 * 60_000;

/** WMO-Wettercode (Open-Meteo) -> vereinfachte Wetterlage */
export function kindFromCode(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "rain"; // 51-67 Niesel/Regen, 80-82 Schauer
}

export const WEATHER_LABEL: Record<WeatherKind, string> = {
  clear: "Sonnig",
  partly: "Leicht bewölkt",
  overcast: "Bedeckt",
  fog: "Nebel",
  rain: "Regen",
  snow: "Schnee",
  thunder: "Gewitter",
};

export function readCachedWeather(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const w = JSON.parse(raw) as Weather;
    return Date.now() - w.at < MAX_AGE ? w : null;
  } catch {
    return null;
  }
}

function position(): Promise<{ lat: number; lng: number; place: Weather["place"] }> {
  return new Promise((resolve) => {
    const fallback = () => resolve({ ...ZUZWIL, place: "default" });
    if (!("geolocation" in navigator)) return fallback();
    navigator.geolocation.getCurrentPosition(
      // auf ca. 1 km gerundet
      (p) =>
        resolve({
          lat: Math.round(p.coords.latitude * 100) / 100,
          lng: Math.round(p.coords.longitude * 100) / 100,
          place: "device",
        }),
      fallback,
      { maximumAge: 30 * 60_000, timeout: 8000, enableHighAccuracy: false },
    );
  });
}

/** Aktuelles Wetter am Standort (Open-Meteo, ohne Schluessel). null bei Fehler. */
export async function loadWeather(): Promise<Weather | null> {
  const cached = readCachedWeather();
  if (cached) return cached;
  try {
    const { lat, lng, place } = await position();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as { current?: { temperature_2m: number; weather_code: number } };
    if (!json.current) return null;
    const w: Weather = {
      kind: kindFromCode(json.current.weather_code),
      temp: Math.round(json.current.temperature_2m),
      lat,
      lng,
      place,
      at: Date.now(),
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(w));
    } catch {
      /* privater Modus */
    }
    return w;
  } catch {
    return null;
  }
}
