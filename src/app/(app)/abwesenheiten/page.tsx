import { createAbsence, deleteAbsence } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { loadAbsences, loadPackCounts } from "@/lib/data";
import { diffDays, formatRange, todayISO } from "@/lib/dates";

export default async function AbsencesPage() {
  const absences = await loadAbsences();
  const today = todayISO();
  const upcoming = absences.filter((a) => a.end_date >= today);
  const past = absences.filter((a) => a.end_date < today).reverse();
  const packs = await loadPackCounts(upcoming.map((a) => a.id));

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">Abwesenheiten</h1>

      <section className="instrument p-5">
        <form action={createAbsence} className="space-y-3">
          <label className="block space-y-1">
            <span className="label">Grund</span>
            <input name="title" defaultValue="Geschäftsreise" className="field" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="label">Von</span>
              <input type="date" name="start_date" required defaultValue={today} className="field" />
            </label>
            <label className="block space-y-1">
              <span className="label">Bis</span>
              <input type="date" name="end_date" required defaultValue={today} className="field" />
            </label>
          </div>
          <SubmitButton className="btn btn-primary w-full" pendingText="Speichere…">
            Abwesenheit erfassen
          </SubmitButton>
        </form>
        <p className="mt-3 text-xs text-dim">
          Wiederkehrende Aufgaben in diesem Zeitraum werden auf den Tag danach verschoben. Fixe Fristen bleiben, werden
          aber markiert, wenn sie in die Abwesenheit oder die zwei Tage danach fallen.
        </p>
      </section>

      {upcoming.length > 0 && (
        <section className="instrument p-4">
          <h2 className="label px-1">Geplant</h2>
          <ul className="mt-2 divide-y divide-line">
            {upcoming.map((a) => {
              const days = diffDays(a.end_date, a.start_date) + 1;
              const running = a.start_date <= today;
              return (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/abwesenheiten/${a.id}`} className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{a.title} ›</div>
                    <div className="text-xs text-dim">
                      {formatRange(a.start_date, a.end_date)} · {days} {days === 1 ? "Tag" : "Tage"}
                      {running && <span className="font-bold text-magenta"> · läuft</span>}
                    </div>
                    <div className="text-xs font-semibold text-cyan">
                      {packs[a.id]
                        ? `Mitnehmen: ${packs[a.id].done}/${packs[a.id].total} eingepackt`
                        : "Mitnehmen-Liste anlegen"}
                    </div>
                  </Link>
                  <form action={deleteAbsence.bind(null, a.id)}>
                    <SubmitButton className="btn btn-danger px-3 py-1.5 text-xs">Löschen</SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="instrument p-4">
          <h2 className="label px-1">Vergangen</h2>
          <ul className="mt-2 space-y-1 text-sm text-dim">
            {past.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={`/abwesenheiten/${a.id}`}>
                  {a.title} · {formatRange(a.start_date, a.end_date)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
