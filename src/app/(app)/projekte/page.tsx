import { createProject } from "@/app/actions";
import { ProjectCard } from "@/components/ProjectCard";
import { SubmitButton } from "@/components/SubmitButton";
import { loadCockpit } from "@/lib/data";

const ORDER = { red: 0, amber: 1, green: 2 } as const;

export default async function ProjectsPage() {
  const { areas, projects, milestones, today } = await loadCockpit();
  const sorted = [...projects].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const code = (id: string) => areas.find((a) => a.id === id)?.code;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">Projekte</h1>

      {sorted.length === 0 && (
        <p className="instrument py-6 text-center text-sm font-bold text-dim">Noch keine aktiven Projekte</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            milestones={milestones.filter((m) => m.project_id === p.id)}
            areaCode={code(p.area_id)}
            today={today}
          />
        ))}
      </div>

      <details className="instrument max-w-lg p-4" open={sorted.length === 0}>
        <summary className="cursor-pointer px-1 text-sm font-bold text-cyan">+ Projekt hinzufügen</summary>
        <form action={createProject} className="mt-3 space-y-3">
          <input name="title" required placeholder="Projekttitel" className="field" />
          <select name="area_id" className="field" aria-label="Bereich">
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <SubmitButton className="btn btn-primary w-full">Anlegen</SubmitButton>
          <p className="text-xs text-dim">Meilensteine fügst du danach direkt in der Projektkarte hinzu.</p>
        </form>
      </details>
    </div>
  );
}
