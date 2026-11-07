import Link from "next/link";
import { addRefereeGame, createReferee, deleteReferee, deleteRefereeGame } from "@/app/actions";
import { loadReferees } from "@/lib/data";
import { formatShort } from "@/lib/dates";
import { QUOTA, quotaStatus, seasonFor, type QuotaState } from "@/lib/quota";
import { SubmitButton } from "./SubmitButton";

const STATE: Record<QuotaState, { color: string; label: string }> = {
  reached: { color: "#12a26a", label: "Erreicht" },
  ok: { color: "#0b8ad6", label: "Machbar" },
  tight: { color: "#e08600", label: "Knapp" },
  critical: { color: "#f0505a", label: "Kritisch" },
};

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
  const reached = refs.filter((r) => data.games.filter((g) => g.referee_id === r.id).length >= QUOTA).length;
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
        Für den Kontingent-Zähler fehlt noch die zweite Datenbank-Migration (siehe README).
      </section>
    );
  }
  const currentYear = Number(today.slice(0, 4));
  const refs = data.referees.filter((r) => r.kind === "verein" && r.active);
  const minis = data.referees.filter((r) => r.kind === "mini");
  const rows = refs
    .map((r) => {
      const games = data.games.filter((g) => g.referee_id === r.id);
      return { ref: r, games, ...quotaStatus(games.length, today, year) };
    })
    .sort((a, b) => a.games.length - b.games.length);
  const reached = rows.filter((r) => r.state === "reached").length;

  return (
    <section className="space-y-3">
      <div className="instrument p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="text-lg font-black">Kontingent {year}</h2>
          <div className="flex gap-2 text-sm font-bold">
            <Link href={`?jahr=${year - 1}`} className="text-cyan">‹ {year - 1}</Link>
            {year < currentYear && <Link href={`?jahr=${year + 1}`} className="text-cyan">{year + 1} ›</Link>}
          </div>
        </div>
        <p className="mt-1 px-1 text-sm text-dim">
          {reached} von {refs.length} Vereins-SR haben {QUOTA} Spiele. Das sichert{" "}
          <span className="font-bold text-ink">{reached * 2} von {refs.length * 2} Mannschaften</span> für die Saison{" "}
          {seasonFor(year)}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ ref, games, remaining, state, weekends }) => {
          const s = STATE[state];
          const pct = Math.min(100, (games.length / QUOTA) * 100);
          return (
            <article key={ref.id} className="instrument p-4">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="font-extrabold">{ref.name}</span>
                <span className="chip text-white" style={{ backgroundColor: s.color }}>{s.label}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1 px-1">
                <span className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{games.length}</span>
                <span className="font-bold text-dim">/ {QUOTA}</span>
                {remaining > 0 && year === currentYear && (
                  <span className="ml-auto text-xs text-dim">
                    noch {remaining} · {weekends} Wochenenden
                  </span>
                )}
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
              </div>

              <form action={addRefereeGame.bind(null, ref.id)} className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <input type="date" name="game_date" defaultValue={today} className="field py-2" aria-label="Spieldatum" />
                <SubmitButton className="btn btn-primary" pendingText="…">+ Spiel</SubmitButton>
              </form>

              {games.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-bold text-cyan">Spiele anzeigen</summary>
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {games.map((g) => (
                      <li key={g.id} className="flex items-center justify-between py-1.5">
                        <span>{formatShort(g.game_date)}{g.note ? ` · ${g.note}` : ""}</span>
                        <form action={deleteRefereeGame.bind(null, g.id)}>
                          <button className="text-xs font-bold text-red">entfernen</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          );
        })}
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
