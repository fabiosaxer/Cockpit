import Link from "next/link";
import {
  createNewcomer,
  createReferee,
  deleteReferee,
  setRefereeNewcomer,
  setRefereeNote,
  setRefereeStatus,
  setSeasonTarget,
} from "@/app/actions";
import { loadReferees } from "@/lib/data";
import {
  GAMES_NEWCOMER,
  GAMES_REGULAR,
  QUOTA_STATUS,
  quotaBalance,
  seasonFor,
  TEAMS_PER_REFEREE,
  type QuotaStatus,
} from "@/lib/quota";
import type { RefereeQuota } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

async function safeLoad(year: number) {
  try {
    return await loadReferees(year);
  } catch {
    return null; // Migration noch nicht ausgefuehrt
  }
}

/** Kalenderjahr, dessen Saison als Naechstes beginnt: bis Ende Juni die laufende Vorbereitung (Vorjahr). */
export function defaultQuotaYear(today: string): number {
  const year = Number(today.slice(0, 4));
  return Number(today.slice(5, 7)) <= 6 ? year - 1 : year;
}

function statusOf(quota: RefereeQuota[], id: string): RefereeQuota | undefined {
  return quota.find((q) => q.referee_id === id);
}

/** Kurzzeile fuer die FC-Zuzwil-Kachel. */
export async function QuotaSummary({ today }: { today: string }) {
  const year = defaultQuotaYear(today);
  const data = await safeLoad(year);
  if (!data) return null;
  const refs = data.referees.filter((r) => r.kind === "verein" && r.active);
  if (!refs.length) return null;
  const b = quotaBalance(
    refs.map((r) => (statusOf(data.quota, r.id)?.status ?? "open") as QuotaStatus),
    data.target,
  );
  const ok = b.target != null ? b.missingTeams === 0 : b.open === 0;
  return (
    <Link href="/bereich/FCZ" className="block space-y-0.5 px-1 text-sm text-dim">
      <span className="text-xs font-extrabold">SAISON {seasonFor(year)}</span>
      <span className="block">
        <span className={`font-bold ${ok ? "text-green" : "text-ink"}`}>
          {b.secured}
          {b.target != null && ` von ${b.target}`} Mannschaften gesichert
        </span>
        {b.onTrack > 0 && <span> · {b.onTrack} auf Kurs</span>}
        {b.paused > 0 && <span className="text-amber"> · {b.paused} SR pausiert</span>}
        {b.missingTeams > 0 && <span className="font-bold text-red"> · {b.missingTeams} fehlen</span>}
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
  const rows = refs.map((r) => {
    const q = statusOf(data.quota, r.id);
    return { ref: r, status: (q?.status ?? "open") as QuotaStatus, note: q?.note ?? null, newcomer: !!q?.newcomer };
  });
  const order: Record<QuotaStatus, number> = { open: 0, paused: 1, on_track: 2, reached: 3 };
  rows.sort((a, b) => order[a.status] - order[b.status] || a.ref.name.localeCompare(b.ref.name));
  const b = quotaBalance(
    rows.map((r) => r.status),
    data.target,
  );
  // Neulinge koennen bis zum Saisonstart (Juli) noch dazukommen
  const newcomerPossible = today < `${year + 1}-07-01`;

  return (
    <section className="space-y-3">
      <div className="instrument p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <div>
            <h2 className="text-lg font-black">Saison {seasonFor(year)}</h2>
            <p className="text-xs text-dim">
              Zählt: Kalenderjahr {year} ({GAMES_REGULAR} Spiele) und Neulinge im Frühling {year + 1} ({GAMES_NEWCOMER}{" "}
              Spiele)
            </p>
          </div>
          <div className="flex gap-3 text-sm font-bold">
            <Link href={`?jahr=${year - 1}`} className="text-cyan">
              ‹ {seasonFor(year - 1)}
            </Link>
            {year < currentYear && (
              <Link href={`?jahr=${year + 1}`} className="text-cyan">
                {seasonFor(year + 1)} ›
              </Link>
            )}
          </div>
        </div>

        {/* Bilanz */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-green/10 py-2">
            <div className="text-2xl font-black text-green tabular-nums">{b.secured}</div>
            <div className="label text-[0.6rem]">Gesichert</div>
          </div>
          <div className="rounded-xl bg-cyan/10 py-2">
            <div className="text-2xl font-black text-cyan tabular-nums">+{b.onTrack}</div>
            <div className="label text-[0.6rem]">Auf Kurs</div>
          </div>
          <form action={setSeasonTarget.bind(null, year)} className="rounded-xl bg-line/50 py-1.5">
            <input
              name="teams"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={data.target ?? ""}
              placeholder="–"
              aria-label="Ziel Mannschaften"
              className="w-14 rounded-lg bg-white text-center text-2xl font-black tabular-nums"
            />
            <SubmitButton className="label block w-full text-[0.6rem] text-cyan" pendingText="…">
              Ziel ✓
            </SubmitButton>
          </form>
        </div>

        {b.target != null && (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
              b.missingTeams > 0 ? "bg-red/10 text-red" : "bg-green/10 text-green"
            }`}
          >
            {b.missingTeams > 0
              ? `Zum Ziel fehlen ${b.missingTeams} Mannschaften, also ${b.missingReferees} Schiedsrichter.${newcomerPossible ? " Ein Neuling aus dem Kurs im Frühling kann die Lücke schliessen." : ""}`
              : b.secured >= b.target
                ? `Ziel von ${b.target} Mannschaften gesichert.`
                : `Ziel von ${b.target} Mannschaften erreichbar, wenn alle auf Kurs bleiben.`}
          </p>
        )}

        {/* Schiedsrichter */}
        {rows.length > 0 ? (
          <ul className="mt-3 divide-y divide-line">
            {rows.map(({ ref, status, note, newcomer }) => {
              const veteran = data.veterans.has(ref.id);
              return (
                <li key={ref.id} className="space-y-2 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      {ref.name}
                      {newcomer && (
                        <span className="chip ml-2 bg-magenta/12 text-magenta">
                          Neuling · {GAMES_NEWCOMER} Spiele
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-dim">
                      {status === "paused"
                        ? "zählt nicht"
                        : `${TEAMS_PER_REFEREE} Mannschaften`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {QUOTA_STATUS.map((s) => {
                      const active = s.value === status;
                      return (
                        <form key={s.value} action={setRefereeStatus.bind(null, ref.id, year, s.value)}>
                          <button
                            type="submit"
                            aria-pressed={active}
                            className="w-full rounded-full border px-1 py-1.5 text-[0.7rem] font-extrabold transition"
                            style={
                              active
                                ? { backgroundColor: s.color, borderColor: s.color, color: "#fff" }
                                : { borderColor: "var(--color-line)", color: "var(--color-dim)" }
                            }
                          >
                            {s.label}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                  {status === "paused" && (
                    <form action={setRefereeNote.bind(null, ref.id, year)} className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        name="note"
                        defaultValue={note ?? ""}
                        placeholder="Grund, z.B. Verletzung, Vaterschaftsurlaub"
                        className="field py-1.5 text-sm"
                      />
                      <SubmitButton className="btn px-3 py-1.5 text-xs">OK</SubmitButton>
                    </form>
                  )}
                  {status !== "paused" && note && <p className="text-xs text-dim">{note}</p>}
                  {!veteran && newcomerPossible && (
                    <form action={setRefereeNewcomer.bind(null, ref.id, year, !newcomer)}>
                      <button className="text-xs font-bold text-magenta">
                        {newcomer ? "Nicht mehr als Neuling zählen" : "Als Neuling zählen (Kurs im Frühling)"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 px-1 text-sm text-dim">Noch keine Vereins-SR erfasst.</p>
        )}
      </div>

      {newcomerPossible && (
        <details className="instrument p-4" open={b.missingTeams > 0}>
          <summary className="cursor-pointer px-1 text-sm font-bold text-magenta">
            + Neuling für den Kurs im Frühling {year + 1}
          </summary>
          <form action={createNewcomer.bind(null, year)} className="mt-3 space-y-2">
            <input name="name" required placeholder="Name" className="field" />
            <input name="note" placeholder="Kurs, z.B. SR-Grundkurs März" className="field" />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="never_before" required className="mt-0.5 size-5 accent-[#7c5cff]" />
              <span>War noch nie Schiedsrichter (sonst zählt die Person nicht als Neuling)</span>
            </label>
            <SubmitButton className="btn btn-primary w-full">Neuling anlegen</SubmitButton>
            <p className="text-xs text-dim">
              Neulinge leiten im Frühling {year + 1} mindestens {GAMES_NEWCOMER} Spiele und sichern damit{" "}
              {TEAMS_PER_REFEREE} Mannschaften für den Start der Saison {seasonFor(year)}.
            </p>
          </form>
        </details>
      )}

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
