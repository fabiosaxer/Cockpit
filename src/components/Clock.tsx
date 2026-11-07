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
