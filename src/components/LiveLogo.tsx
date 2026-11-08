"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

type PermissionAware = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/** Antippen: der kuenstliche Horizont folgt der Neigung des Geraets. Nochmals antippen: aus. */
export function LiveLogo({ size }: { size: number }) {
  const [active, setActive] = useState(false);
  const [att, setAtt] = useState({ roll: -12, pitch: 0 });
  const handler = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  useEffect(() => () => {
    if (handler.current) window.removeEventListener("deviceorientation", handler.current);
  }, []);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      if (handler.current) window.removeEventListener("deviceorientation", handler.current);
      setActive(false);
      setAtt({ roll: -12, pitch: 0 });
      return;
    }
    const DOE = window.DeviceOrientationEvent as PermissionAware | undefined;
    if (!DOE) return;
    try {
      if (typeof DOE.requestPermission === "function" && (await DOE.requestPermission()) !== "granted") return;
    } catch {
      return;
    }
    handler.current = (ev: DeviceOrientationEvent) => {
      const beta = ev.beta ?? 0; // vor/zurueck
      const gamma = ev.gamma ?? 0; // links/rechts
      const angle = (screen.orientation?.angle ?? 0) % 360;
      let roll = gamma;
      let pitch = beta - 40; // typische Haltung im Hochformat
      if (angle === 90) [roll, pitch] = [beta, -gamma - 40];
      else if (angle === 270 || angle === -90) [roll, pitch] = [-beta, gamma - 40];
      else if (angle === 180) [roll, pitch] = [-gamma, -beta - 40];
      setAtt({ roll: clamp(-roll, 60), pitch: clamp(pitch * 0.35, 14) });
    };
    window.addEventListener("deviceorientation", handler.current);
    setActive(true);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggle}
      aria-label={active ? "Künstlichen Horizont anhalten" : "Künstlichen Horizont beleben"}
      className={`rounded-full shadow-[0_6px_16px_-6px_rgba(10,60,110,0.6)] ${active ? "ring-2 ring-sun" : ""}`}
    >
      <Logo size={size} roll={att.roll} pitch={att.pitch} />
    </span>
  );
}
