"use client";

import { useEffect, useState } from "react";

function fmt(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

/** Lokalzeit und UTC wie im Cockpit (LT / Z). */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="font-mono text-xs leading-tight text-right tabular-nums text-white drop-shadow-[0_1px_1px_rgba(10,60,110,0.4)]">
      <div>
        <span className="opacity-75">LT </span>
        <span className="font-bold">{now ? fmt(now, "Europe/Zurich") : "--:--"}</span>
      </div>
      <div>
        <span className="opacity-75">UTC </span>
        <span className="font-bold">{now ? fmt(now, "UTC").replace(":", "") + "Z" : "----Z"}</span>
      </div>
    </div>
  );
}

/** Begruessung nach Tageszeit, auf dem Geraet berechnet und minuetlich aktualisiert. */
export function Greeting() {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const update = () =>
      setHour(
        // en-GB liefert die reine Zahl ("02"); de-CH wuerde "2 Uhr" liefern
        Number.parseInt(
          new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Zurich" }).format(
            new Date(),
          ),
          10,
        ),
      );
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);
  if (hour === null) return <>Hallo</>;
  if (hour < 5) return <>Gute Nacht</>;
  if (hour < 11) return <>Guten Morgen</>;
  if (hour < 17) return <>Hallo</>;
  return <>Guten Abend</>;
}

/** Nach 1 Uhr nachts ein dezenter Hinweis. */
export function CrewRest() {
  const [late, setLate] = useState(false);
  useEffect(() => {
    const check = () => {
      const h = Number.parseInt(
        new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Zurich" }).format(new Date()),
        10,
      );
      setLate(h >= 1 && h < 5);
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, []);
  if (!late) return null;
  return (
    <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
      Crew Rest empfohlen
    </span>
  );
}

/** Kleine Wetteranzeige neben der Uhr (Daten kommen von der Sky-Komponente). */
export function WeatherBadge() {
  const [w, setW] = useState<{ kind: string; temp: number; place: string } | null>(null);
  useEffect(() => {
    const on = (e: Event) => setW((e as CustomEvent).detail);
    window.addEventListener("cockpit:weather", on);
    return () => window.removeEventListener("cockpit:weather", on);
  }, []);
  if (!w) return null;
  const icon: Record<string, string> = {
    clear: "☀️",
    partly: "🌤️",
    overcast: "☁️",
    fog: "🌫️",
    rain: "🌧️",
    snow: "🌨️",
    thunder: "⛈️",
  };
  return (
    <div
      className="text-right font-mono text-xs leading-tight font-bold text-white drop-shadow-[0_1px_1px_rgba(10,60,110,0.4)]"
      title={w.place === "default" ? "Wetter in Zuzwil" : "Wetter am Standort"}
    >
      <span aria-hidden="true">{icon[w.kind] ?? ""}</span> {w.temp}°
    </div>
  );
}
