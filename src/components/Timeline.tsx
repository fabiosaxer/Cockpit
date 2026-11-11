import Link from "next/link";
import { prepareEvent } from "@/app/actions";
import { areaColor } from "@/lib/areaColors";
import { addDays, weekday } from "@/lib/dates";
import type { ClassifiedItem } from "@/lib/logic";
import type { Area } from "@/lib/types";
import { PlanButton } from "./PlanButton";

const DAYS = 14;
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function Pill({ item, code, prepared }: { item: ClassifiedItem; code: string; prepared?: boolean }) {
  const color = areaColor(code);
  const content = (
    <span
      className="block rounded-lg px-1.5 py-1 text-[0.7rem] leading-tight font-semibold"
      style={{ backgroundColor: `${color}1a`, borderLeft: `3px solid ${color}` }}
    >
      {item.event?.time && <span className="block font-mono text-[0.6rem] text-dim">{item.event.time}</span>}
      <span className="line-clamp-2 break-words">{item.title}</span>
      {item.deadline && <span className="block text-[0.6rem] font-bold text-red">kritisch</span>}
    </span>
  );
  if (item.event) {
    return (
      <div className="relative">
        {item.event.webLink ? (
          <a href={item.event.webLink} target="_blank" rel="noreferrer" title={item.title} className="block pr-5">
            {content}
          </a>
        ) : (
          <div className="pr-5">{content}</div>
        )}
        {/* Vorbereitungsaufgabe fuer heute anlegen */}
        <form
          action={prepareEvent.bind(null, item.title, item.area_id, item.due_date)}
          className="absolute top-0.5 -right-1 scale-75"
        >
          <PlanButton active={!!prepared} label={`${item.title} vorbereiten`} />
        </form>
      </div>
    );
  }
  return (
    <Link href={`/eintrag/${item.id}`} title={item.title}>
      {content}
    </Link>
  );
}

/** Zeitstrahl ueber die naechsten 14 Tage, alle Bereiche gemeinsam, unabhaengig vom Vorlauf. */
export function Timeline({ items: allItems, areas, today }: { items: ClassifiedItem[]; areas: Area[]; today: string }) {
  const items = allItems.filter((i) => !i.event?.quiet);
  // Termine, fuer die schon eine offene Vorbereitungsaufgabe existiert
  const prepared = new Set(
    allItems.filter((i) => !i.event && !i.done_at && i.title.startsWith("Vorbereiten: ")).map((i) => i.title.slice(13)),
  );
  const code = (areaId: string) => areas.find((a) => a.id === areaId)?.code ?? "";
  const end = addDays(today, DAYS - 1);
  const overdue = items.filter((i) => i.state === "overdue");
  const days = Array.from({ length: DAYS }, (_, n) => addDays(today, n));
  const upcoming = items.filter((i) => i.due_date >= today && i.due_date <= end);
  const sortInDay = (a: ClassifiedItem, b: ClassifiedItem) =>
    (a.event?.time ?? "99").localeCompare(b.event?.time ?? "99") || a.title.localeCompare(b.title);

  return (
    <section className="instrument overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-3">
        <h2 className="label">Nächste 14 Tage</h2>
        <span className="text-xs text-dim">
          {upcoming.length} {upcoming.length === 1 ? "Eintrag" : "Einträge"}
        </span>
      </div>

      <div className="flex snap-x overflow-x-auto px-2 pt-2 pb-3 [scrollbar-width:thin]">
        {overdue.length > 0 && (
          <div className="w-[6.5rem] shrink-0 snap-start px-1">
            <div className="mb-1 text-center text-xs font-extrabold text-red">Überfällig</div>
            <div className="relative mb-2 h-3">
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-red/40" />
              <div className="absolute top-1/2 left-1/2 size-3 -translate-1/2 rounded-full bg-red" />
            </div>
            <div className="space-y-1">
              {overdue.map((i) => (
                <Pill key={i.id} item={i} code={code(i.area_id)} prepared={!!i.event && prepared.has(i.title)} />
              ))}
            </div>
          </div>
        )}

        {days.map((d) => {
          const list = upcoming.filter((i) => i.due_date === d).sort(sortInDay);
          const isToday = d === today;
          const wd = weekday(d);
          const weekend = wd === 0 || wd === 6;
          return (
            <div key={d} className="w-[6.5rem] shrink-0 snap-start px-1">
              <div className={`mb-1 text-center text-xs ${isToday ? "font-black text-amber" : weekend ? "text-dim/70" : "text-dim"}`}>
                {isToday ? "Heute" : WEEKDAYS[wd]} {Number(d.slice(8, 10))}.{Number(d.slice(5, 7))}.
              </div>
              <div className="relative mb-2 h-3">
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
                <div
                  className={`absolute top-1/2 left-1/2 -translate-1/2 rounded-full ${
                    isToday ? "size-3 bg-sun ring-4 ring-sun/30" : list.length ? "size-2.5 bg-cyan" : "size-1.5 bg-line"
                  }`}
                />
              </div>
              <div className="space-y-1">
                {list.map((i) => (
                  <Pill key={i.id} item={i} code={code(i.area_id)} prepared={!!i.event && prepared.has(i.title)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
