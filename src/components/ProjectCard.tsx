import Link from "next/link";
import { archiveProject, completeItem, createMilestone, restoreItem, setProjectStatus, updateProject } from "@/app/actions";
import { diffDays, formatShort } from "@/lib/dates";
import { countdown } from "@/lib/logic";
import type { Item, Project, ProjectStatus } from "@/lib/types";
import { AreaChip } from "./AreaChip";
import { StatusLight, STATUS_LABEL } from "./StatusLight";
import { DoneButton, SubmitButton } from "./SubmitButton";

const STATUSES: ProjectStatus[] = ["green", "amber", "red"];

function pill(days: number): string {
  if (days < 0) return "bg-red text-white";
  if (days === 0) return "bg-sun text-ink";
  if (days <= 7) return "bg-cyan/12 text-cyan";
  return "bg-line/70 text-dim";
}

export function Progress({ milestones }: { milestones: Item[] }) {
  const done = milestones.filter((m) => m.done_at).length;
  const pct = milestones.length ? (done / milestones.length) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-dim tabular-nums">
        {done}/{milestones.length}
      </span>
    </div>
  );
}

/** Vollstaendige Projektkarte mit Meilensteinen. */
export function ProjectCard({
  project,
  milestones,
  areaCode,
  today,
  back = "/projekte",
}: {
  project: Project;
  milestones: Item[];
  areaCode?: string;
  today: string;
  back?: string;
}) {
  const sorted = [...milestones].sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <article className="instrument p-4">
      <div className="flex items-center gap-3 px-1">
        <StatusLight status={project.status} size="size-3" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black">{project.title}</div>
          <div className="flex items-center gap-1.5 text-xs text-dim">
            {areaCode && <AreaChip code={areaCode} />}
            <span>{STATUS_LABEL[project.status]}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 px-1">
        <Progress milestones={milestones} />
      </div>

      <ul className="mt-2 divide-y divide-line">
        {sorted.map((m) => {
          const days = diffDays(m.due_date, today);
          return (
            <li key={m.id} className="flex items-center gap-3 py-2">
              {m.done_at ? (
                <form action={restoreItem.bind(null, m.id)}>
                  <button
                    aria-label={`Wieder öffnen: ${m.title}`}
                    className="grid size-7 place-items-center rounded-full bg-green text-sm text-white"
                  >
                    ✓
                  </button>
                </form>
              ) : (
                <form action={completeItem.bind(null, m.id)}>
                  <DoneButton label={m.title} />
                </form>
              )}
              <Link href={`/eintrag/${m.id}?back=${encodeURIComponent(back)}`} className="min-w-0 flex-1">
                <div className={`truncate text-sm font-semibold ${m.done_at ? "text-dim line-through" : ""}`}>
                  {m.title}
                </div>
                <div className="text-xs text-dim">{formatShort(m.due_date)}</div>
              </Link>
              {!m.done_at && <span className={`chip shrink-0 tabular-nums ${pill(days)}`}>{countdown(days)}</span>}
            </li>
          );
        })}
      </ul>

      <form action={createMilestone.bind(null, project.id)} className="mt-2 grid grid-cols-[1fr_8.5rem_auto] gap-2">
        <input name="title" required placeholder="Neuer Meilenstein" className="field px-3 py-2 text-sm" />
        <input type="date" name="due_date" required defaultValue={today} className="field px-2 py-2 text-sm" aria-label="Datum" />
        <SubmitButton className="btn btn-primary px-3" pendingText="…">+</SubmitButton>
      </form>

      <div className="mt-3 flex gap-2">
        {STATUSES.map((s) => (
          <form key={s} action={setProjectStatus.bind(null, project.id, s)} className="flex-1">
            <button
              type="submit"
              className={`btn w-full gap-2 px-2 py-1.5 ${project.status === s ? "border-ink/40" : "opacity-60"}`}
            >
              <StatusLight status={s} size="size-2" />
              <span className="text-xs">{STATUS_LABEL[s]}</span>
            </button>
          </form>
        ))}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-bold text-cyan">Projekt bearbeiten</summary>
        <form action={updateProject.bind(null, project.id)} className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <input name="title" defaultValue={project.title} className="field" aria-label="Titel" />
          <SubmitButton className="btn">OK</SubmitButton>
        </form>
        <form action={archiveProject.bind(null, project.id)} className="mt-2">
          <SubmitButton className="btn btn-danger w-full">Projekt abschliessen und archivieren</SubmitButton>
        </form>
      </details>
    </article>
  );
}

/** Kompakte Karte fuer die Uebersicht. */
export function ProjectSummary({
  project,
  milestones,
  areaCode,
  today,
}: {
  project: Project;
  milestones: Item[];
  areaCode?: string;
  today: string;
}) {
  const next = milestones
    .filter((m) => !m.done_at)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const days = next ? diffDays(next.due_date, today) : null;

  return (
    <Link href="/projekte" className="instrument block space-y-2 p-4">
      <div className="flex items-center gap-2.5">
        <StatusLight status={project.status} size="size-3" />
        <span className="min-w-0 flex-1 truncate font-extrabold">{project.title}</span>
        {areaCode && <AreaChip code={areaCode} />}
      </div>
      {next && days != null ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-xs font-extrabold text-magenta">NÄCHSTER MEILENSTEIN</span>
          <span className="min-w-0 flex-1 truncate">{next.title}</span>
          <span className={`chip shrink-0 tabular-nums ${pill(days)}`}>{countdown(days)}</span>
        </div>
      ) : (
        <div className="text-sm text-dim">{milestones.length ? "Alle Meilensteine erledigt" : "Noch keine Meilensteine"}</div>
      )}
      {milestones.length > 0 && <Progress milestones={milestones} />}
    </Link>
  );
}
