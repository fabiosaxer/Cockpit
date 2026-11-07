import Link from "next/link";
import { createReferee, deleteReferee, setRefereeQuota } from "@/app/actions";
import { loadReferees } from "@/lib/data";
import { seasonFor, TEAMS_PER_REFEREE } from "@/lib/quota";
import { SubmitButton } from "./SubmitButton";

async function safeLoad(year: number) {
  try {
    return await loadReferees(year);
  } catch {
    return null; // Migration noch nicht ausgefuehrt
  }
}

/** Kurzzeile fuer die FC-Zuzwil-Kachel. */
export async function QuotaSummary({ today }: { today: string }) {
  const year = Number(today.slice(0, 4));
  const data = await safeLoad(year);
  if (!data) return null;
  const refs = data.referees.filter((r) => r.kind === "verein" && r.active);
  if (!refs.length) return null;
  const reached = refs.filter((r) => data.quota.some((q) => q.referee_id === r.id && q.reached)).length;
  return (
    <Link href="/bereich/FCZ" className="flex items-center gap-2 px-1 text-sm text-dim">
      <span className="text-xs font-extrabold">KONTINGENT {year}</span>
      <span className={reached === refs.length ? "font-bold text-green" : "font-bold text-ink"}>
        {reached} von {refs.length} SR erreicht
      </span>
    </Link>
  );
}

export async function QuotaSection({ today, year }: { today: string; year: number }) {
  const data = await safeLoad(year);
  if (!data) {
    return (
      <section className="instrument p-4 text-sm">
        Für das Kontingent fehlt noch eine Datenbank-Migration (siehe README).
      </section>
    );
  }
  const currentYear = Number(today.slice(0, 4));
  const refs = data.referees.filter((r) => r.kind === "verein" && r.active);
  const minis = data.referees.filter((r) => r.kind === "mini");
  const isReached = (id: string) => data.quota.some((q) => q.referee_id === id && q.reached);
  const reached = refs.filter((r) => isReached(r.id)).length;

  return (
    <section className="space-y-3">
      <div className="instrument p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="text-lg font-black">Kontingent {year}</h2>
          <div className="flex gap-3 text-sm font-bold">
            <Link href={`?jahr=${year - 1}`} className="text-cyan">‹ {year - 1}</Link>
            {year < currentYear && <Link href={`?jahr=${year + 1}`} className="text-cyan">{year + 1} ›</Link>}
          </div>
        </div>
        <p className="mt-1 px-1 text-sm text-dim">
          {reached} von {refs.length} Vereins-SR erreicht. Gesichert für die Saison {seasonFor(year)}:{" "}
          <span className="font-bold text-ink">
            {reached * TEAMS_PER_REFEREE} von {refs.length * TEAMS_PER_REFEREE} Mannschaften
          </span>
        </p>

        {refs.length > 0 ? (
          <ul className="mt-3 divide-y divide-line">
            {refs.map((r) => {
              const ok = isReached(r.id);
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-semibold">{r.name}</span>
                  <form action={setRefereeQuota.bind(null, r.id, year, !ok)}>
                    <SubmitButton
                      className={`btn px-4 py-1.5 text-sm ${ok ? "border-green bg-green text-white" : "text-dim"}`}
                      pendingText="…"
                    >
                      {ok ? "✓ Erreicht" : "Offen"}
                    </SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 px-1 text-sm text-dim">Noch keine Vereins-SR erfasst.</p>
        )}
      </div>

      <details className="instrument p-4">
        <summary className="cursor-pointer px-1 text-sm font-bold text-cyan">Schiedsrichter verwalten</summary>
        <p className="mt-2 px-1 text-xs text-dim">Vorname oder Kürzel genügt.</p>
        <form action={createReferee} className="mt-3 grid grid-cols-[1fr_7rem_auto] gap-2">
          <input name="name" required placeholder="Name" className="field" />
          <select name="kind" className="field" aria-label="Art">
            <option value="verein">Verein</option>
            <option value="mini">Mini</option>
          </select>
          <SubmitButton className="btn btn-primary">+</SubmitButton>
        </form>
        <ul className="mt-3 divide-y divide-line text-sm">
          {[...refs, ...minis].map((r) => (
            <li key={r.id} className="flex items-center justify-between py-1.5">
              <span>
                {r.name} <span className="text-xs text-dim">· {r.kind === "mini" ? "Mini-SR" : "Vereins-SR"}</span>
              </span>
              <form action={deleteReferee.bind(null, r.id)}>
                <button className="text-xs font-bold text-red">entfernen</button>
              </form>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
