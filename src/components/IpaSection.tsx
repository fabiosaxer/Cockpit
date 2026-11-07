import Link from "next/link";
import { createIpaCandidate, deleteIpaCandidate } from "@/app/actions";
import { loadIpa } from "@/lib/data";
import { addDays, formatRange, formatShort } from "@/lib/dates";
import { SubmitButton } from "./SubmitButton";

export async function IpaSection({ today }: { today: string }) {
  let data: Awaited<ReturnType<typeof loadIpa>>;
  try {
    data = await loadIpa();
  } catch {
    return (
      <section className="instrument p-4 text-sm">
        Für die IPA-Vorlage fehlt noch die zweite Datenbank-Migration (siehe README).
      </section>
    );
  }
  const { candidates, points } = data;
  // Kandidaten bleiben bis 30 Tage nach dem letzten Fixpunkt sichtbar
  const lastPoint = (id: string) => points.filter((p) => p.ipa_candidate_id === id).at(-1)?.due_date ?? "";
  const active = candidates.filter((c) => lastPoint(c.id) >= addDays(today, -30));

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((c) => {
          const pts = points.filter((p) => p.ipa_candidate_id === c.id);
          return (
            <article key={c.id} className="instrument p-4">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <span className="text-lg font-black">IPA {c.code}</span>
                <span className="text-sm text-dim">{formatRange(c.start_date, c.end_date)}</span>
              </div>
              <ol className="mt-3 space-y-1.5">
                {pts.map((p) => {
                  const done = !!p.done_at;
                  const past = !done && p.due_date < today;
                  return (
                    <li key={p.id}>
                      <Link href={`/eintrag/${p.id}?back=/bereich/IPA`} className="flex items-center gap-3 text-sm">
                        <span
                          className={`size-2.5 shrink-0 rounded-full ${
                            done ? "bg-green" : past ? "bg-red" : p.due_date === today ? "bg-sun" : "bg-line"
                          }`}
                        />
                        <span className={`w-20 shrink-0 tabular-nums ${done ? "text-dim" : "font-semibold"}`}>
                          {formatShort(p.due_date)}
                        </span>
                        <span className={`truncate ${done ? "text-dim line-through" : ""}`}>
                          {p.title.replace(`IPA ${c.code}: `, "")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-bold text-dim">Kandidat entfernen</summary>
                <form action={deleteIpaCandidate.bind(null, c.id)} className="mt-2">
                  <SubmitButton className="btn btn-danger w-full">IPA {c.code} mit allen Fixpunkten löschen</SubmitButton>
                </form>
              </details>
            </article>
          );
        })}
      </div>

      <details className="instrument p-4" open={active.length === 0}>
        <summary className="cursor-pointer px-1 text-sm font-bold text-cyan">+ IPA-Kandidat hinzufügen</summary>
        <form action={createIpaCandidate} className="mt-3 space-y-3">
          <label className="block space-y-1">
            <span className="label">Kürzel (keine vollen Namen)</span>
            <input name="code" required maxLength={8} placeholder="z.B. AB" className="field uppercase" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="label">Start IPA</span>
              <input type="date" name="start_date" required className="field" />
            </label>
            <label className="block space-y-1">
              <span className="label">Ende / Abgabe</span>
              <input type="date" name="end_date" required className="field" />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="label">Präsentation (leer = ca. 3 Wochen nach Abgabe)</span>
            <input type="date" name="presentation_date" className="field" />
          </label>
          <SubmitButton className="btn btn-primary w-full" pendingText="Lege an…">
            Kandidat und Fixpunkte anlegen
          </SubmitButton>
          <p className="text-xs text-dim">
            Angelegt werden: Validierungsgespräch (2 Arbeitstage vor Start), Besuch 1 (2. Tag), Besuch 2 (Mitte), Abgabe,
            Korrektur & Fachfragen (sichtbar ab Abgabe) und Präsentation. Jeder Fixpunkt lässt sich danach einzeln verschieben.
          </p>
        </form>
      </details>
    </section>
  );
}
