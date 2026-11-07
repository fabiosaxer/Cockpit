import { createProject } from "@/app/actions";
import { ProjectCard } from "@/components/ProjectCard";
import { SubmitButton } from "@/components/SubmitButton";
import { loadCockpit } from "@/lib/data";

const ORDER = { red: 0, amber: 1, green: 2 } as const;

export default async function ProjectsPage() {
  const { areas, projects, today } = await loadCockpit();
  const sorted = [...projects].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const code = (id: string) => areas.find((a) => a.id === id)?.code;

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-sm tracking-[0.25em] text-cyan">PROJEKTE IM LEAD</h1>

      {sorted.length === 0 && (
        <p className="instrument py-6 text-center font-mono text-xs tracking-[0.2em] text-dim">KEINE AKTIVEN PROJEKTE</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p) => (
          <ProjectCard key={p.id} project={p} areaCode={code(p.area_id)} today={today} />
        ))}
      </div>

      <details className="instrument max-w-lg p-4 pt-3">
        <summary className="label cursor-pointer px-2 text-cyan">+ Projekt hinzufügen</summary>
        <form action={createProject} className="mt-3 space-y-3">
          <input name="title" required placeholder="Projekttitel" className="field" />
          <select name="area_id" className="field" aria-label="Bereich">
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
          <input name="next_step" placeholder="Nächster Schritt" className="field" />
          <label className="block space-y-1">
            <span className="label">Nächster Meilenstein</span>
            <input type="date" name="next_milestone" className="field" />
          </label>
          <SubmitButton className="btn btn-primary w-full">Anlegen</SubmitButton>
        </form>
      </details>
    </div>
  );
}
