import Link from "next/link";
import { notFound } from "next/navigation";
import { createProject, restoreItem } from "@/app/actions";
import { ItemRow, STATE_STYLE } from "@/components/ItemRow";
import { ProjectCard } from "@/components/ProjectCard";
import { IpaSection } from "@/components/IpaSection";
import { ModulesSection } from "@/components/ModulesSection";
import { QuickAdd } from "@/components/QuickAdd";
import { defaultQuotaYear, QuotaSection } from "@/components/QuotaSection";
import { SubmitButton } from "@/components/SubmitButton";
import { loadCockpit, loadDone, loadOutlookItems } from "@/lib/data";
import { areaColor } from "@/lib/areaColors";
import { classifyAll, type ItemState } from "@/lib/logic";

const SECTIONS: ItemState[] = ["overdue", "today", "approach", "later"];

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ jahr?: string }>;
}) {
  const { code } = await params;
  const { jahr } = await searchParams;
  const { areas, types, items, projects, absences, milestones, modules, today } = await loadCockpit();
  const area = areas.find((a) => a.code.toLowerCase() === code.toLowerCase());
  if (!area) notFound();

  const back = `/bereich/${area.code}`;
  const outlook = await loadOutlookItems(areas);
  const all = classifyAll(
    [...items, ...outlook.items].filter((i) => i.area_id === area.id),
    types,
    today,
    absences,
  );
  const currentYear = Number(today.slice(0, 4));
  const year = Math.min(currentYear, Number(jahr) || defaultQuotaYear(today));
  const areaProjects = projects.filter((p) => p.area_id === area.id);
  const done = await loadDone(area.id);
  const typeName = (id: string | null) => types.find((t) => t.id === id)?.name;
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.title;
  const moduleName = (id?: string | null) => modules.find((m) => m.id === id)?.name;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-bold text-white/90">‹ Cockpit</Link>
        <h1 className="flex items-center gap-2">
          <span className="chip bg-white text-base" style={{ color: areaColor(area.code) }}>{area.code}</span>
          <span className="text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">{area.name}</span>
        </h1>
      </div>

      {area.code === "IPA" && <IpaSection today={today} />}
      {area.code === "FCZ" && <QuotaSection today={today} year={year} />}
      {area.code === "ZHAW" && <ModulesSection modules={modules} items={all} />}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <section className="instrument p-4 pt-3">
          {all.length === 0 && (
            <p className="py-6 text-center text-sm font-bold text-green">Keine offenen Einträge</p>
          )}
          {SECTIONS.map((state) => {
            const list = all.filter((i) => i.state === state);
            if (!list.length) return null;
            return (
              <div key={state} className="mt-2 px-2">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${STATE_STYLE[state].bar}`} />
                  <span className="label">{STATE_STYLE[state].label} · {list.length}</span>
                </div>
                <ul className="divide-y divide-line/60">
                  {list.map((i) => (
                    <ItemRow
                      key={i.id}
                      item={i}
                      typeName={typeName(i.type_id)}
                      projectName={projectName(i.project_id) ?? moduleName(i.module_id)}
                      back={back}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <aside className="space-y-3">
          <h2 className="label px-1">Projekte</h2>
          {areaProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              milestones={milestones.filter((m) => m.project_id === p.id)}
              today={today}
              back={back}
            />
          ))}
          <details className="instrument p-4 pt-3">
            <summary className="label cursor-pointer px-2 text-cyan">+ Projekt hinzufügen</summary>
            <form action={createProject} className="mt-3 space-y-3">
              <input type="hidden" name="area_id" value={area.id} />
              <input name="title" required placeholder="Projekttitel" className="field" />
              <SubmitButton className="btn btn-primary w-full">Anlegen</SubmitButton>
            </form>
          </details>

          {done.length > 0 && (
            <div className="instrument p-4 pt-3">
              <h2 className="label px-2">Zuletzt erledigt</h2>
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

      <QuickAdd
        areas={areas}
        types={types}
        projects={projects}
        modules={modules}
        today={today}
        defaultAreaId={area.id}
      />
    </div>
  );
}
