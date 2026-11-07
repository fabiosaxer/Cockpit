import { createType, renameArea, updateTypeLead } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { loadCockpit, requireSession } from "@/lib/data";

export default async function SettingsPage() {
  const { areas, types } = await loadCockpit();
  const { user } = await requireSession();

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">Einstellungen</h1>

      <section className="instrument p-4 pt-3">
        <h2 className="label px-2">Typen & Vorlauf (Tage)</h2>
        <ul className="mt-3 space-y-2">
          {types.map((t) => (
            <li key={t.id}>
              <form action={updateTypeLead.bind(null, t.id)} className="grid grid-cols-[1fr_5rem_auto] gap-2">
                <input name="name" defaultValue={t.name} className="field" aria-label="Name" />
                <input name="lead_days" type="number" min={0} inputMode="numeric" defaultValue={t.lead_days} className="field" aria-label="Vorlauf" />
                <SubmitButton className="btn">OK</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={createType} className="mt-4 grid grid-cols-[1fr_5rem_auto] gap-2 border-t border-line pt-4">
          <input name="name" placeholder="Neuer Typ" required className="field" />
          <input name="lead_days" type="number" min={0} inputMode="numeric" placeholder="0" className="field" aria-label="Vorlauf" />
          <SubmitButton className="btn btn-primary">+</SubmitButton>
        </form>
      </section>

      <section className="instrument p-4 pt-3">
        <h2 className="label px-2">Bereiche</h2>
        <ul className="mt-3 space-y-2">
          {areas.map((a) => (
            <li key={a.id}>
              <form action={renameArea.bind(null, a.id)} className="grid grid-cols-[4rem_1fr_auto] items-center gap-2">
                <span className="font-mono text-sm text-cyan">{a.code}</span>
                <input name="name" defaultValue={a.name} className="field" aria-label="Name" />
                <SubmitButton className="btn">OK</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="instrument flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 px-2">
          <div className="label">Angemeldet</div>
          <div className="truncate font-mono text-sm">{user.email}</div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn btn-danger">Abmelden</button>
        </form>
      </section>
    </div>
  );
}
