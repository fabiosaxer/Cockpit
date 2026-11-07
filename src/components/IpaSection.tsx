import Link from "next/link";
import { deleteIpaCandidate } from "@/app/actions";
import { loadIpa } from "@/lib/data";
import { addDays, formatRange, formatShort } from "@/lib/dates";
import { PROFESSION_LABEL } from "@/lib/ipa";
import { IpaForm } from "./IpaForm";
import { SubmitButton } from "./SubmitButton";

export async function IpaSection({ today }: { today: string }) {
  let data: Awaited<ReturnType<typeof loadIpa>>;
  try {
    data = await loadIpa();
  } catch {
    return (
      <section className="instrument p-4 text-sm">
        Für die IPA-Vorlage fehlen noch Datenbank-Migrationen (siehe README).
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
              <div className="px-1 text-xs text-dim">{PROFESSION_LABEL[c.profession ?? "informatiker"]}</div>
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
        <IpaForm />
      </details>
    </section>
  );
}
