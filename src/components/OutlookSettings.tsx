import { disconnectOutlook, saveCalendarCategory } from "@/app/actions";
import { requireSession } from "@/lib/data";
import { addDays, todayISO } from "@/lib/dates";
import { fetchEvents, getAccessToken, outlookConfigured } from "@/lib/outlook";
import type { Area, CalendarCategory } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

const MESSAGES: Record<string, string> = {
  ok: "Outlook ist verbunden.",
  config: "Es fehlen Umgebungsvariablen in Vercel (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY).",
  error: "Verbindung fehlgeschlagen",
};

export async function OutlookSettings({ areas, message, reason }: { areas: Area[]; message?: string; reason?: string }) {
  const notice = message && MESSAGES[message] && (
    <p
      className={`rounded-xl px-3 py-2 text-sm font-semibold ${
        message === "ok" ? "bg-green/10 text-green" : "bg-red/10 text-red"
      }`}
    >
      {MESSAGES[message]}
      {reason ? `: ${reason}` : "."}
    </p>
  );

  if (!outlookConfigured()) {
    return (
      <section className="instrument space-y-2 p-4">
        <h2 className="label px-1">Outlook-Kalender</h2>
        {notice}
        <p className="px-1 text-sm text-dim">{MESSAGES.config}</p>
      </section>
    );
  }

  const { supabase } = await requireSession();
  let tableMissing = false;
  const { data: tokenRow, error: tokenErr } = await supabase.from("oauth_tokens").select("account, updated_at").maybeSingle();
  if (tokenErr) tableMissing = true;
  const { data: catRows } = await supabase.from("calendar_categories").select("*").order("category");
  const cats = (catRows ?? []) as CalendarCategory[];

  // Kategorien aus kommenden Terminen, die noch keine Zuordnung haben
  let discovered: string[] = [];
  let fetchError = false;
  if (tokenRow) {
    try {
      const token = await getAccessToken(supabase);
      if (token) {
        const today = todayISO();
        const events = await fetchEvents(token, today, addDays(today, 180));
        const known = new Set(cats.map((c) => c.category.toLowerCase()));
        discovered = [...new Set(events.flatMap((e) => e.categories))].filter((c) => !known.has(c.toLowerCase()));
      }
    } catch {
      fetchError = true;
    }
  }

  const rows: { category: string; area_id: string | null; lead_days: number; hidden: boolean; in_timeline?: boolean }[] = [
    ...cats,
    ...discovered.map((c) => ({ category: c, area_id: null, lead_days: 0, hidden: false, in_timeline: true })),
  ].sort((a, b) => (a.category === "" ? 1 : b.category === "" ? -1 : a.category.localeCompare(b.category)));

  return (
    <section className="instrument space-y-3 p-4">
      <h2 className="label px-1">Outlook-Kalender</h2>
      {notice}
      {tableMissing ? (
        <p className="px-1 text-sm text-dim">Es fehlt noch die Datenbank-Migration für Outlook (siehe README).</p>
      ) : tokenRow ? (
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0 text-sm">
            <div className="font-semibold text-green">Verbunden</div>
            <div className="truncate text-dim">{tokenRow.account}</div>
            {fetchError && (
              <div className="font-semibold text-red">
                Termine konnten nicht geladen werden. Bitte neu verbinden.
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <a href="/api/outlook/connect" className="btn px-3 py-1.5 text-xs">Neu verbinden</a>
            <form action={disconnectOutlook}>
              <SubmitButton className="btn btn-danger px-3 py-1.5 text-xs">Trennen</SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <a href="/api/outlook/connect" className="btn btn-primary w-full">Mit Outlook verbinden</a>
      )}

      {tokenRow && rows.length > 0 && (
        <div className="space-y-2 border-t border-line pt-3">
          <p className="px-1 text-xs text-dim">
            Jede Outlook-Kategorie landet in einem Bereich. Die Zahl ist der Vorlauf in Tagen. „Im Zeitstrahl“ aus: Termine erscheinen nur in der Bereichskachel (z.B. Lektionen).
          </p>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.category || "_none"}>
                <form action={saveCalendarCategory} className="space-y-1.5 rounded-xl border border-line p-2.5">
                  <input type="hidden" name="category" value={r.category} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{r.category || "Ohne Kategorie"}</span>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-dim">
                      <input
                        type="checkbox"
                        name="in_timeline"
                        defaultChecked={r.in_timeline !== false}
                        className="size-4 accent-[#0b8ad6]"
                      />
                      Im Zeitstrahl
                    </label>
                  </div>
                  <div className="grid grid-cols-[1fr_3.5rem_auto] items-center gap-2">
                    <select
                      name="area_id"
                      defaultValue={r.hidden ? "hidden" : (r.area_id ?? "")}
                      className="field px-2 py-2 text-sm"
                      aria-label="Bereich"
                    >
                      {!r.area_id && !r.hidden && <option value="">– Bereich wählen –</option>}
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                      <option value="hidden">Ausblenden</option>
                    </select>
                    <input
                      name="lead_days"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      defaultValue={r.lead_days}
                      className="field px-2 py-2 text-sm"
                      aria-label="Vorlauf in Tagen"
                    />
                    <SubmitButton className="btn px-3 py-2 text-xs">OK</SubmitButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
