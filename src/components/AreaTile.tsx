import Link from "next/link";
import { areaColor } from "@/lib/areaColors";
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
  extra,
}: {
  area: Area;
  items: ClassifiedItem[];
  projects: Project[];
  types: ItemType[];
  extra?: React.ReactNode;
}) {
  const active = items.filter((i) => i.state !== "later");
  const next = items.find((i) => i.state === "later");
  const shown = active.slice(0, MAX_ROWS);
  const hidden = active.length - shown.length;
  const typeName = (id: string | null) => types.find((t) => t.id === id)?.name;
  const flagged = projects.filter((p) => p.status !== "green");
  const color = areaColor(area.code);

  return (
    <article className="instrument flex flex-col overflow-hidden">
      <Link
        href={`/bereich/${area.code}`}
        className="flex items-center justify-between gap-2 px-4 py-3"
        style={{ background: `linear-gradient(90deg, ${color}1f, ${color}05)` }}
      >
        <div className="flex items-center gap-2.5">
          <span className="chip text-white" style={{ backgroundColor: color }}>
            {area.code}
          </span>
          <span className="font-extrabold">{area.name}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {active.length ? `${active.length} aktiv ›` : "›"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {shown.length ? (
          <ul className="divide-y divide-line">
            {shown.map((i) => (
              <ItemRow key={i.id} item={i} typeName={typeName(i.type_id)} />
            ))}
          </ul>
        ) : (
          <p className="py-5 text-center text-sm font-bold text-green">Nichts Dringendes</p>
        )}
        {hidden > 0 && (
          <Link href={`/bereich/${area.code}`} className="pt-1 text-sm font-bold text-cyan">
            + {hidden} weitere
          </Link>
        )}

        <div className="mt-auto space-y-1.5 pt-3">
          {extra}
          {next && (
            <div className="flex items-center gap-2 rounded-xl bg-magenta/8 px-3 py-1.5 text-sm">
              <span className="shrink-0 text-xs font-extrabold text-magenta">ALS NÄCHSTES</span>
              <span className="truncate text-ink/80">
                {next.title} · {formatShort(next.due_date)}
              </span>
            </div>
          )}
          {projects.length > 0 && (
            <Link href="/projekte" className="flex items-center gap-2 px-1 text-sm text-dim">
              <span className="text-xs font-extrabold">PROJEKTE</span>
              <span className="flex gap-1">
                {projects.map((p) => (
                  <StatusLight key={p.id} status={p.status} size="size-2.5" />
                ))}
              </span>
              {flagged.length > 0 && <span className="truncate font-semibold text-amber">{flagged[0].title}</span>}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
