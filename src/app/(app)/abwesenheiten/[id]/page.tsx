import Link from "next/link";
import { notFound } from "next/navigation";
import { addPackItems, copyPackList, deletePackItem, resetPackList, togglePackItem } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { loadAbsence } from "@/lib/data";
import { diffDays, formatRange, todayISO } from "@/lib/dates";

export default async function AbsenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: Awaited<ReturnType<typeof loadAbsence>>;
  try {
    data = await loadAbsence(id);
  } catch {
    data = null;
  }
  if (!data) notFound();
  const { absence, items, previous } = data;
  const today = todayISO();
  const days = diffDays(absence.end_date, absence.start_date) + 1;
  const until = diffDays(absence.start_date, today);
  const done = items.filter((i) => i.checked).length;
  const open = items.filter((i) => !i.checked);
  const packed = items.filter((i) => i.checked);
  const pct = items.length ? (done / items.length) * 100 : 0;

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/abwesenheiten" className="font-bold text-white">
        ‹ Abwesenheiten
      </Link>

      <section className="instrument p-5">
        <h1 className="text-xl font-black">{absence.title}</h1>
        <p className="text-sm text-dim">
          {formatRange(absence.start_date, absence.end_date)} · {days} {days === 1 ? "Tag" : "Tage"}
          {until > 0 && ` · in ${until} ${until === 1 ? "Tag" : "Tagen"}`}
          {until <= 0 && absence.end_date >= today && <span className="font-bold text-magenta"> · läuft</span>}
        </p>
      </section>

      <section className="instrument p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-black">Mitnehmen</h2>
          {items.length > 0 && (
            <span className={`text-sm font-bold ${done === items.length ? "text-green" : "text-dim"}`}>
              {done}/{items.length} eingepackt
            </span>
          )}
        </div>
        {items.length > 0 && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-green transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        )}

        <form action={addPackItems.bind(null, absence.id)} className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <input name="title" required placeholder="z.B. Pass, Ladekabel, Laptop" className="field" autoComplete="off" />
          <SubmitButton className="btn btn-primary px-4" pendingText="…">
            +
          </SubmitButton>
        </form>
        <p className="mt-1 px-1 text-xs text-dim">Mehrere auf einmal mit Komma trennen.</p>

        {items.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {[...open, ...packed].map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2">
                <form action={togglePackItem.bind(null, i.id, !i.checked)}>
                  <button
                    aria-label={i.checked ? `Nicht eingepackt: ${i.title}` : `Eingepackt: ${i.title}`}
                    className={`grid size-7 place-items-center rounded-lg border-2 transition ${
                      i.checked ? "border-green bg-green text-white" : "border-cyan/40 bg-white"
                    }`}
                  >
                    {i.checked && (
                      <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                        <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                      </svg>
                    )}
                  </button>
                </form>
                <span className={`min-w-0 flex-1 truncate ${i.checked ? "text-dim line-through" : "font-semibold"}`}>
                  {i.title}
                </span>
                <form action={deletePackItem.bind(null, i.id)}>
                  <button className="px-1 text-lg leading-none text-dim" aria-label={`Entfernen: ${i.title}`}>
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {done > 0 && (
          <form action={resetPackList.bind(null, absence.id)} className="mt-3">
            <SubmitButton className="text-xs font-bold text-cyan">Alle Häkchen entfernen (z.B. für die Rückreise)</SubmitButton>
          </form>
        )}
      </section>

      {previous.length > 0 && (
        <details className="instrument p-4" open={items.length === 0}>
          <summary className="cursor-pointer px-1 text-sm font-bold text-cyan">Liste einer früheren Reise übernehmen</summary>
          <ul className="mt-2 divide-y divide-line">
            {previous.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{p.title}</span>{" "}
                  <span className="text-dim">
                    · {formatRange(p.start_date, p.end_date)} · {p.count} Punkte
                  </span>
                </span>
                <form action={copyPackList.bind(null, p.id, absence.id)}>
                  <SubmitButton className="btn px-3 py-1.5 text-xs" pendingText="…">
                    Übernehmen
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
