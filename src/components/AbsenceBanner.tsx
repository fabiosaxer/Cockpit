import Link from "next/link";
import { addDays, formatRange } from "@/lib/dates";
import type { Absence } from "@/lib/types";

/** Hinweis auf laufende oder bald beginnende Abwesenheit (14 Tage im Voraus). */
export function AbsenceBanner({
  absences,
  today,
  packs = {},
}: {
  absences: Absence[];
  today: string;
  packs?: Record<string, { done: number; total: number }>;
}) {
  const soon = absences.filter((a) => a.end_date >= today && a.start_date <= addDays(today, 14));
  if (!soon.length) return null;
  return (
    <Link
      href={soon.length === 1 ? `/abwesenheiten/${soon[0].id}` : "/abwesenheiten"}
      className="instrument flex items-center gap-3 px-4 py-3"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-magenta/12 text-magenta">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M8 7V4h8v3M3 7h18v12H3zM3 12h18" />
        </svg>
      </span>
      <div className="min-w-0 text-sm">
        {soon.map((a) => (
          <div key={a.id} className="truncate">
            <span className="font-extrabold">{a.start_date <= today ? "Abwesend" : "Bald abwesend"}:</span>{" "}
            {a.title} · {formatRange(a.start_date, a.end_date)}
            {packs[a.id] && (
              <span className={packs[a.id].done === packs[a.id].total ? "font-bold text-green" : "text-dim"}>
                {" "}
                · {packs[a.id].done}/{packs[a.id].total} eingepackt
              </span>
            )}
          </div>
        ))}
      </div>
    </Link>
  );
}
