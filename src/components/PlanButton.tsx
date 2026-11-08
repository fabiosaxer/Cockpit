"use client";

import { useFormStatus } from "react-dom";

const SUN = "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";

/** Sonnen-Knopf: auf die Heute-Liste setzen (gefuellt = schon eingeplant). */
export function PlanButton({ active, label }: { active: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={active ? `Von der Heute-Liste nehmen: ${label}` : `Heute erledigen: ${label}`}
      title={active ? "Von der Heute-Liste nehmen" : "Heute erledigen"}
      className={`grid size-7 shrink-0 place-items-center rounded-full transition ${
        active ? "bg-sun text-ink shadow-[0_0_0_3px_rgba(255,201,60,0.35)]" : "text-dim/60 hover:bg-sun/20 hover:text-amber"
      } ${pending ? "animate-pulse" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d={SUN} />
      </svg>
    </button>
  );
}
