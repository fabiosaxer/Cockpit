import { archiveProject, setProjectStatus, updateProject } from "@/app/actions";
import { formatShort, diffDays } from "@/lib/dates";
import type { Project, ProjectStatus } from "@/lib/types";
import { StatusLight, STATUS_LABEL } from "./StatusLight";
import { SubmitButton } from "./SubmitButton";

const STATUSES: ProjectStatus[] = ["green", "amber", "red"];

export function ProjectCard({ project, areaCode, today }: { project: Project; areaCode?: string; today: string }) {
  const days = project.next_milestone ? diffDays(project.next_milestone, today) : null;
  return (
    <article className="instrument p-4 pt-3">
      <div className="flex items-center gap-3 px-2">
        <StatusLight status={project.status} size="size-3" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{project.title}</div>
          <div className="text-xs text-dim">
            {areaCode && <span className="text-cyan">{areaCode} · </span>}
            {STATUS_LABEL[project.status]}
            {project.next_milestone && (
              <span className={days != null && days < 0 ? "text-red" : "text-magenta"}>
                {" "}
                · Meilenstein {formatShort(project.next_milestone)}
              </span>
            )}
          </div>
        </div>
      </div>

      {project.next_step && (
        <p className="mt-3 rounded-xl bg-cyan/8 px-3 py-2 text-sm">
          <span className="label block">Nächster Schritt</span>
          {project.next_step}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        {STATUSES.map((s) => (
          <form key={s} action={setProjectStatus.bind(null, project.id, s)} className="flex-1">
            <button
              type="submit"
              className={`btn w-full gap-2 px-2 ${project.status === s ? "border-ink/40" : "opacity-60"}`}
            >
              <StatusLight status={s} size="size-2" />
              <span className="text-xs">{STATUS_LABEL[s]}</span>
            </button>
          </form>
        ))}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-bold text-cyan">Bearbeiten</summary>
        <form action={updateProject.bind(null, project.id)} className="mt-3 space-y-3">
          <input type="hidden" name="status" value={project.status} />
          <input name="title" defaultValue={project.title} className="field" aria-label="Titel" />
          <input name="next_step" defaultValue={project.next_step ?? ""} placeholder="Nächster Schritt" className="field" />
          <label className="block space-y-1">
            <span className="label">Nächster Meilenstein</span>
            <input type="date" name="next_milestone" defaultValue={project.next_milestone ?? ""} className="field" />
          </label>
          <SubmitButton className="btn btn-primary w-full">Speichern</SubmitButton>
        </form>
        <form action={archiveProject.bind(null, project.id)} className="mt-2">
          <SubmitButton className="btn btn-danger w-full">Archivieren</SubmitButton>
        </form>
      </details>
    </article>
  );
}
