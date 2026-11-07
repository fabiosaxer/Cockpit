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
    <div className="font-mono text-xs leading-tight text-right tabular-nums">
      <div>
        <span className="text-dim">LT </span>
        <span className="text-green">{now ? fmt(now, "Europe/Zurich") : "--:--"}</span>
      </div>
      <div>
        <span className="text-dim">UTC </span>
        <span className="text-cyan">{now ? fmt(now, "UTC").replace(":", "") + "Z" : "----Z"}</span>
      </div>
    </div>
  );
}
