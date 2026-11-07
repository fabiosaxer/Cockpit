import Link from "next/link";
import { formatShort } from "@/lib/dates";
import type { ClassifiedItem } from "@/lib/logic";
import type { Area, ItemType, Project } from "@/lib/types";
import { ItemRow } from "./ItemRow";
import { StatusLight } from "./StatusLight";

const MAX_ROWS = 5;

export function AreaTile({
  area,
  items,
  projects,
  types,
}: {
  area: Area;
  items: ClassifiedItem[];
  projects: Project[];
  types: ItemType[];
}) {
  const active = items.filter((i) => i.state !== "later");
  const next = items.find((i) => i.state === "later");
  const shown = active.slice(0, MAX_ROWS);
  const hidden = active.length - shown.length;
  const overdue = active.filter((i) => i.state === "overdue").length;
  const typeName = (id: string | null) => types.find((t) => t.id === id)?.name;
  const flagged = projects.filter((p) => p.status !== "green");

  return (
    <article className={`instrument flex flex-col p-4 pt-3 ${overdue ? "border-red/50" : ""}`}>
      <Link href={`/bereich/${area.code}`} className="flex items-baseline justify-between gap-2 px-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold tracking-widest text-cyan">{area.code}</span>
          <span className="text-sm text-ink/90">{area.name}</span>
        </div>
        <span className="label">{active.length ? `${active.length} aktiv` : ""} ›</span>
      </Link>

      <div className="mt-2 border-t border-line" />

      {shown.length ? (
        <ul className="divide-y divide-line/60">
          {shown.map((i) => (
            <ItemRow key={i.id} item={i} typeName={typeName(i.type_id)} />
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center font-mono text-xs tracking-[0.2em] text-green/80">CLEAR · NICHTS IM ANFLUG</p>
      )}
      {hidden > 0 && (
        <Link href={`/bereich/${area.code}`} className="label pt-1 text-cyan">
          + {hidden} weitere
        </Link>
      )}

      <div className="mt-auto space-y-1.5 pt-3">
        {next && (
          <div className="flex items-center justify-between gap-2 font-mono text-[0.7rem]">
            <span className="shrink-0 text-dim">NÄCHSTER WEGPUNKT</span>
            <span className="truncate text-magenta">
              {next.title} · {formatShort(next.due_date)}
            </span>
          </div>
        )}
        {projects.length > 0 && (
          <Link href="/projekte" className="flex items-center gap-2 font-mono text-[0.7rem] text-dim">
            <span>PROJEKTE</span>
            <span className="flex gap-1">
              {projects.map((p) => (
                <StatusLight key={p.id} status={p.status} size="size-2" />
              ))}
            </span>
            {flagged.length > 0 && <span className="truncate text-amber">{flagged[0].title}</span>}
          </Link>
        )}
      </div>
    </article>
  );
}
