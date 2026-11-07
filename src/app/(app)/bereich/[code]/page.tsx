import Link from "next/link";
import { notFound } from "next/navigation";
import { createProject, restoreItem } from "@/app/actions";
import { ItemRow, STATE_STYLE } from "@/components/ItemRow";
import { ProjectCard } from "@/components/ProjectCard";
import { QuickAdd } from "@/components/QuickAdd";
import { SubmitButton } from "@/components/SubmitButton";
import { loadCockpit, loadDone } from "@/lib/data";
import { classifyAll, type ItemState } from "@/lib/logic";

const SECTIONS: ItemState[] = ["overdue", "today", "approach", "later"];

export default async function AreaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { areas, types, items, projects, today } = await loadCockpit();
  const area = areas.find((a) => a.code.toLowerCase() === code.toLowerCase());
  if (!area) notFound();

  const back = `/bereich/${area.code}`;
  const all = classifyAll(items.filter((i) => i.area_id === area.id), types, today);
  const areaProjects = projects.filter((p) => p.area_id === area.id);
  const done = await loadDone(area.id);
  const typeName = (id: string | null) => types.find((t) => t.id === id)?.name;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <Link href="/" className="label text-cyan">‹ Cockpit</Link>
        <h1 className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold tracking-widest text-cyan">{area.code}</span>
          <span className="text-lg">{area.name}</span>
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <section className="instrument p-4 pt-3">
          {all.length === 0 && (
            <p className="py-6 text-center font-mono text-xs tracking-[0.2em] text-green/80">CLEAR · KEINE OFFENEN EINTRÄGE</p>
          )}
          {SECTIONS.map((state) => {
            const list = all.filter((i) => i.state === state);
            if (!list.length) return null;
            return (
              <div key={state} className="mt-2 px-2">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-1 rounded-sm ${STATE_STYLE[state].bar}`} />
                  <span className="label">{STATE_STYLE[state].label} · {list.length}</span>
                </div>
                <ul className="divide-y divide-line/60">
                  {list.map((i) => (
                    <ItemRow key={i.id} item={i} typeName={typeName(i.type_id)} back={back} />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <aside className="space-y-3">
          <h2 className="label px-1">Projekte</h2>
          {areaProjects.map((p) => (
            <ProjectCard key={p.id} project={p} today={today} />
          ))}
          <details className="instrument p-4 pt-3">
            <summary className="label cursor-pointer px-2 text-cyan">+ Projekt hinzufügen</summary>
            <form action={createProject} className="mt-3 space-y-3">
              <input type="hidden" name="area_id" value={area.id} />
              <input name="title" required placeholder="Projekttitel" className="field" />
              <input name="next_step" placeholder="Nächster Schritt" className="field" />
              <label className="block space-y-1">
                <span className="label">Nächster Meilenstein</span>
                <input type="date" name="next_milestone" className="field" />
              </label>
              <SubmitButton className="btn btn-primary w-full">Anlegen</SubmitButton>
            </form>
          </details>

          {done.length > 0 && (
            <div className="instrument p-4 pt-3">
              <h2 className="label px-2">Gelandet</h2>
              <ul className="mt-2 divide-y divide-line/60">
                {done.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="text-green">✓</span>
                    <span className="min-w-0 flex-1 truncate text-dim line-through">{i.title}</span>
                    <form action={restoreItem.bind(null, i.id)}>
                      <SubmitButton className="label text-cyan">Zurück</SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <QuickAdd areas={areas} types={types} projects={projects} today={today} defaultAreaId={area.id} />
    </div>
  );
}
