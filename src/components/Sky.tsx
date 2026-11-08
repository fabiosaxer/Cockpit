"use client";

import { useEffect, useMemo, useState } from "react";
import { skyPhase, type SkyPhase } from "@/lib/sun";

/* ---------- Himmel je Tageszeit ---------- */

const GRADIENTS: Record<SkyPhase, string> = {
  day: "linear-gradient(180deg, #3fa9f2 0px, #7cc6f8 180px, #c4e6fd 380px, #eef7ff 620px, #f6fbff 900px)",
  dawn: "linear-gradient(180deg, #e98f9a 0px, #f6b59a 170px, #f9d8b4 330px, #e3effa 600px, #f6fbff 900px)",
  golden: "linear-gradient(180deg, #f08a4b 0px, #f6a96a 160px, #f9cf9a 340px, #f5ebe1 620px, #f8f6f3 900px)",
  dusk: "linear-gradient(180deg, #34357e 0px, #7a52a3 170px, #e2878f 360px, #efe2ea 640px, #f6f4f8 900px)",
  night: "linear-gradient(180deg, #07122b 0px, #11265a 200px, #27467f 420px, #c3d0e4 760px, #eef2f8 1000px)",
};

type Special = { swiss: boolean; snow: boolean; fireworks: boolean; birthday: boolean };
type Craft = "jet" | "eagle" | "balloon" | "glider" | "biplane" | "paper";

function zurichParts(now: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Seltene Flieger: meistens der Jet, ab und zu etwas anderes. */
function pickCraft(birthday: boolean): Craft {
  if (birthday) return "biplane";
  const r = Math.random();
  if (r < 0.8) return "jet";
  if (r < 0.88) return "eagle";
  if (r < 0.92) return "balloon";
  if (r < 0.95) return "glider";
  if (r < 0.98) return "biplane";
  return "paper";
}

// deterministische Sterne, damit sie nicht bei jedem Rendern springen
const STARS = Array.from({ length: 70 }, (_, i) => {
  const x = (i * 9301 + 49297) % 233280;
  const y = (i * 4793 + 1237) % 9973;
  return { left: (x / 233280) * 100, top: (y / 9973) * 55, size: i % 7 === 0 ? 2.5 : 1.5, delay: (i % 10) * 0.37 };
});

/* ---------- Fluggeraete (SVG, Blickrichtung rechts) ---------- */

function Jet({ night }: { night: boolean }) {
  return (
    <svg viewBox="0 0 48 24" className="h-5 w-10 text-white drop-shadow" fill="currentColor" aria-hidden="true">
      <path d="M46 12c0-1.6-1.6-2.6-3.6-2.6H30L19.5 0h-4l5.8 9.4H9.5L5.2 4.2H2l2.6 7.8L2 19.8h3.2l4.3-5.2h11.8L15.5 24h4L30 14.6h12.4c2 0 3.6-1 3.6-2.6z" />
      {night && (
        <>
          {/* Positionslichter: links rot, rechts gruen, Strobe weiss */}
          <circle cx="17" cy="1.5" r="1.6" fill="#ff4b4b" />
          <circle cx="17" cy="22.5" r="1.6" fill="#3ee083" />
          <circle cx="3" cy="12" r="1.4" fill="#fff" className="strobe" />
          <circle cx="24" cy="12" r="1.2" fill="#ff4b4b" className="strobe-slow" />
        </>
      )}
    </svg>
  );
}

/** Steinadler im Gleitflug: dunkelbraun, goldener Nacken, gespreizte Handschwingen. */
function Eagle() {
  return (
    <svg viewBox="0 0 120 50" className="eagle h-9 w-20 drop-shadow" aria-hidden="true">
      <g className="eagle-wings">
        {/* Fluegel mit gespreizten "Fingern" */}
        <path
          d="M60 24 C48 14 32 8 6 10 L10 13 L4 15 L10 17 L5 20 L13 21 L10 24 C26 26 44 28 56 30 Z"
          fill="#4a2f1a"
        />
        <path
          d="M60 24 C72 14 88 8 114 10 L110 13 L116 15 L110 17 L115 20 L107 21 L110 24 C94 26 76 28 64 30 Z"
          fill="#4a2f1a"
        />
        <path d="M12 12 C30 11 46 16 58 25 C44 22 28 19 12 18 Z" fill="#6b4426" opacity="0.6" />
        <path d="M108 12 C90 11 74 16 62 25 C76 22 92 19 108 18 Z" fill="#6b4426" opacity="0.6" />
      </g>
      {/* Koerper und Schwanz */}
      <path d="M52 26 C54 22 66 22 68 26 L66 36 L72 46 L60 42 L48 46 L54 36 Z" fill="#3d2615" />
      {/* Kopf mit goldenem Nacken, Blick nach rechts */}
      <circle cx="68" cy="23" r="5" fill="#c8913d" />
      <path d="M72 21 L79 23 L72 25 Z" fill="#ffc93c" />
      <circle cx="70" cy="22" r="0.9" fill="#1a1a1a" />
    </svg>
  );
}

function Balloon() {
  return (
    <svg viewBox="0 0 40 56" className="h-12 w-9 drop-shadow" aria-hidden="true">
      <path d="M20 2C9 2 2 10 2 19c0 9 9 16 13 22h10c4-6 13-13 13-22C38 10 31 2 20 2z" fill="#f0505a" />
      <path d="M20 2c-5 0-8 8-8 17s4 16 5 22h6c1-6 5-13 5-22S25 2 20 2z" fill="#ffc93c" />
      <path d="M15 41l2 7M25 41l-2 7" stroke="#7a4a24" strokeWidth="1.2" />
      <rect x="15.5" y="48" width="9" height="6" rx="1.5" fill="#7a4a24" />
    </svg>
  );
}

function Glider() {
  return (
    <svg viewBox="0 0 80 20" className="h-4 w-16 text-white drop-shadow" fill="currentColor" aria-hidden="true">
      <path d="M2 9.2h76v1.6H2zM50 7c4 0 12 1.4 14 3-2 1.6-10 3-14 3H14l-4 4H7l2-6-2-5h3l4 1z" />
    </svg>
  );
}

function Biplane({ text }: { text: string }) {
  return (
    <div className="flex items-center">
      <span className="mr-1 rounded-sm border border-white/70 bg-white/90 px-2 py-0.5 text-[0.7rem] font-extrabold whitespace-nowrap text-ink shadow">
        {text}
      </span>
      <span className="h-px w-6 bg-white/80" />
      <svg viewBox="0 0 44 28" className="h-6 w-10 drop-shadow" aria-hidden="true">
        <rect x="14" y="3" width="6" height="22" rx="2" fill="#ffc93c" />
        <rect x="24" y="3" width="6" height="22" rx="2" fill="#ffc93c" />
        <path d="M4 14c0-2 2-3.5 5-3.5h26c3 0 6 1.5 6 3.5s-3 3.5-6 3.5H9c-3 0-5-1.5-5-3.5z" fill="#f0505a" />
        <path d="M41 9v10" stroke="#7a4a24" strokeWidth="2" />
      </svg>
    </div>
  );
}

function PaperPlane() {
  return (
    <svg viewBox="0 0 40 24" className="h-5 w-9 drop-shadow" aria-hidden="true">
      <path d="M2 4l36 8-36 8 8-8z" fill="#fff" />
      <path d="M10 12l28 0" stroke="#c4e6fd" strokeWidth="1" />
    </svg>
  );
}

/* ---------- Sky ---------- */

export function Sky({ birthday }: { birthday?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [craft, setCraft] = useState<Craft>("jet");
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const d = new Date();
    setNow(d);
    const { month, day } = zurichParts(d);
    const isBirthday = !!birthday && birthday === `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Versteckt: ?flieger=eagle (oder jet, balloon, glider, biplane, paper) erzwingt einen Flieger
    const forced = new URLSearchParams(window.location.search).get("flieger") as Craft | null;
    const crafts: Craft[] = ["jet", "eagle", "balloon", "glider", "biplane", "paper"];
    setCraft(forced && crafts.includes(forced) ? forced : pickCraft(isBirthday));
    const t = setInterval(() => setNow(new Date()), 60_000);

    const onCelebrate = () => {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3800);
    };
    window.addEventListener("cockpit:celebrate", onCelebrate);
    return () => {
      clearInterval(t);
      window.removeEventListener("cockpit:celebrate", onCelebrate);
    };
  }, [birthday]);

  const phase: SkyPhase = now ? skyPhase(now) : "day";
  const special: Special = useMemo(() => {
    if (!now) return { swiss: false, snow: false, fireworks: false, birthday: false };
    const { month, day, hour, minute } = zurichParts(now);
    const md = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return {
      swiss: md === "08-01",
      snow: month === 12,
      fireworks: (md === "12-31" && hour * 60 + minute >= 23 * 60 + 30) || (md === "01-01" && hour < 1),
      birthday: !!birthday && md === birthday,
    };
  }, [now, birthday]);

  const night = phase === "night";
  const dark = night || phase === "dusk";
  const banner = special.birthday ? "Alles Gute zum Geburtstag, Fabio!" : "Grüsse aus Zuzwil";

  return (
    <>
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 transition-[background] duration-[3000ms]" style={{ background: GRADIENTS[phase] }} />

      {/* Wolken, nachts nur angedeutet */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] bg-[url('/sky/clouds.svg')] bg-[length:1400px_auto] bg-top bg-no-repeat"
        style={{ opacity: night ? 0.12 : dark ? 0.35 : 1 }}
      />

      {/* Sterne und Mond */}
      {dark && (
        <div className="absolute inset-0" style={{ opacity: night ? 1 : 0.5 }}>
          {STARS.map((s, i) => (
            <span
              key={i}
              className="twinkle absolute rounded-full bg-white"
              style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
            />
          ))}
          {night && (
            <span className="absolute top-24 right-[12%] size-10 rounded-full bg-[#fdf6d8] shadow-[0_0_30px_rgba(253,246,216,0.6)]">
              <span className="absolute -top-1 -right-2 size-10 rounded-full" style={{ background: "#0d1f48" }} />
            </span>
          )}
        </div>
      )}

      {/* Schnee im Dezember */}
      {special.snow &&
        Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="snow absolute -top-4 rounded-full bg-white/90"
            style={{
              left: `${(i * 37) % 100}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              animationDuration: `${9 + (i % 7)}s`,
              animationDelay: `${(i % 12) * 0.8}s`,
            }}
          />
        ))}

      {/* Feuerwerk an Silvester */}
      {special.fireworks &&
        [12, 38, 64, 86].map((left, i) => (
          <span key={i} className="firework absolute" style={{ left: `${left}%`, top: `${12 + (i % 2) * 10}%`, animationDelay: `${i * 0.6}s` }}>
            {Array.from({ length: 12 }, (_, k) => (
              <span
                key={k}
                className="absolute size-1.5 rounded-full"
                style={{
                  background: ["#ffc93c", "#f0505a", "#3fd8f2", "#7c5cff"][(i + k) % 4],
                  transform: `rotate(${k * 30}deg) translateX(var(--burst))`,
                }}
              />
            ))}
          </span>
        ))}

      {/* Fluggeraet mit Kondensstreifen */}
      {!celebrate && (
        <div className="absolute top-[4.6rem] left-0 w-full">
          <div
            className={`flex w-max items-center ${
              craft === "balloon" ? "drift" : craft === "paper" ? "plane wobble" : craft === "eagle" ? "soar" : "plane"
            }`}
          >
            {craft === "jet" && (
              <span
                className="h-[2px] w-40 rounded-full"
                style={{
                  background: special.swiss
                    ? "linear-gradient(90deg, transparent, #e30613 30%, #fff 50%, #e30613 70%, #fff)"
                    : "linear-gradient(90deg, transparent, rgba(255,255,255,0.8))",
                  height: special.swiss ? 4 : 2,
                }}
              />
            )}
            {craft === "jet" && <Jet night={dark} />}
            {craft === "eagle" && <Eagle />}
            {craft === "balloon" && <Balloon />}
            {craft === "glider" && <Glider />}
            {craft === "biplane" && <Biplane text={banner} />}
            {craft === "paper" && <PaperPlane />}
          </div>
        </div>
      )}

    </div>
    {/* Looping, wenn die Heute-Liste erledigt ist (ueber dem Inhalt) */}
    {celebrate && (
      <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-x-0 top-28 flex flex-col items-center">
          <div className="loop-arm relative size-40">
            <span className="absolute top-0 left-1/2 -translate-x-1/2">
              <Jet night={false} />
            </span>
          </div>
          <span className="mt-2 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-green shadow-lg">
            Alles erledigt für heute!
          </span>
        </div>
      </div>
    )}
    </>
  );
}
