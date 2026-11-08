"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

type PermissionAware = typeof DeviceMotionEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

const DEG = 180 / Math.PI;
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
const norm = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

function screenAngle(): number {
  const a = screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0;
  return ((a % 360) + 360) % 360;
}

/**
 * Antippen: der kuenstliche Horizont folgt dem Geraet wie ein echtes Instrument.
 * Querlage aus dem Schwerkraftvektor in der Bildschirmebene (bleibt waagrecht zur echten Welt),
 * Laengsneigung relativ zur Haltung beim Einschalten. Nochmals antippen: aus.
 */
export function LiveLogo({ size }: { size: number }) {
  const [active, setActive] = useState(false);
  const [att, setAtt] = useState({ roll: -12, pitch: 0 });
  const handler = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const smooth = useRef({ roll: 0, pitch: 0, base: null as number | null });

  useEffect(
    () => () => {
      if (handler.current) window.removeEventListener("devicemotion", handler.current);
    },
    [],
  );

  async function toggle(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      if (handler.current) window.removeEventListener("devicemotion", handler.current);
      handler.current = null;
      setActive(false);
      setAtt({ roll: -12, pitch: 0 });
      return;
    }
    const DME = window.DeviceMotionEvent as PermissionAware | undefined;
    if (!DME) return;
    try {
      if (typeof DME.requestPermission === "function" && (await DME.requestPermission()) !== "granted") return;
    } catch {
      return;
    }

    smooth.current = { roll: 0, pitch: 0, base: null };
    handler.current = (ev: DeviceMotionEvent) => {
      const g = ev.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null || g.z == null) return;
      const mag = Math.hypot(g.x, g.y, g.z) || 9.81;

      // Drehung des Geraets in der Bildschirmebene (positiv = gegen den Uhrzeigersinn),
      // korrigiert um die Bildschirmausrichtung (Hoch-/Querformat)
      const deviceRoll = Math.atan2(-g.x, -g.y) * DEG;
      const roll = norm(deviceRoll - screenAngle());

      // Laengsneigung: Anteil der Schwerkraft senkrecht zum Bildschirm
      const tilt = Math.asin(clamp(g.z / mag, 1)) * DEG;
      const s = smooth.current;
      if (s.base === null) s.base = tilt;

      // sanft glaetten, Querlage ueber die -180/180-Grenze hinweg
      s.roll = s.roll + 0.25 * norm(roll - s.roll);
      s.pitch = s.pitch + 0.25 * (tilt - s.base - s.pitch);
      setAtt({ roll: s.roll, pitch: clamp(s.pitch * 0.45, 16) });
    };
    window.addEventListener("devicemotion", handler.current);
    setActive(true);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle(e)}
      aria-label={active ? "Künstlichen Horizont anhalten" : "Künstlichen Horizont beleben"}
      className={`rounded-full shadow-[0_6px_16px_-6px_rgba(10,60,110,0.6)] ${active ? "ring-2 ring-sun" : ""}`}
    >
      <Logo size={size} roll={att.roll} pitch={att.pitch} />
    </span>
  );
}
