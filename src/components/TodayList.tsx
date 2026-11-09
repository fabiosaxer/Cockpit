import Link from "next/link";
import { completeItem, setPlannedToday } from "@/app/actions";
import { areaColor } from "@/lib/areaColors";
import { diffDays, formatShort } from "@/lib/dates";
import { todayTasks, type ClassifiedItem } from "@/lib/logic";
import type { Area, ItemType } from "@/lib/types";
import { DoneButton } from "./SubmitButton";

/** Heute-Liste: eingeplante und heute faellige/ueberfaellige Aufgaben (ohne Termine), hervorgehoben zuoberst. */
export function TodayList({
  items,
  types,
  areas,
  today,
}: {
  items: ClassifiedItem[];
  types: ItemType[];
  areas: Area[];
  today: string;
}) {
  const planned = todayTasks(items, types, today);
  if (!planned.length) return null;

  return (
    <section className="instrument overflow-hidden border-2 border-sun">
      <div className="flex items-center justify-between bg-gradient-to-r from-sun/40 to-sun/10 px-4 py-2.5">
        <h2 className="font-black">Heute erledigen</h2>
        <span className="chip bg-white text-amber">{planned.length}</span>
      </div>
      <ul className="divide-y divide-line px-4">
        {planned.map((i) => {
          const area = areas.find((a) => a.id === i.area_id);
          const days = diffDays(i.due_date, today);
          const carried = !!i.planned_for && i.planned_for < today;
          return (
            <li key={i.id} className="flex items-center gap-3 py-2.5">
              <form action={completeItem.bind(null, i.id)}>
                <DoneButton label={i.title} />
              </form>
              <Link href={`/eintrag/${i.id}`} className="min-w-0 flex-1">
                <div className="truncate font-bold">{i.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-dim">
                  {area && (
                    <span
                      className="chip"
                      style={{
                        color: areaColor(area.code),
                        backgroundColor: `${areaColor(area.code)}1a`,
                      }}
                    >
                      {area.code}
                    </span>
                  )}
                  <span className={days < 0 ? "font-bold text-red" : ""}>
                    {days === 0
                      ? "fällig heute"
                      : days < 0
                        ? `seit ${formatShort(i.due_date)} überfällig`
                        : `fällig ${formatShort(i.due_date)}`}
                  </span>
                  {carried && (
                    <span className="font-bold text-amber">
                      · eingeplant {formatShort(i.planned_for!)}
                    </span>
                  )}
                </div>
              </Link>
              {i.planned_for && i.due_date > today && (
                <form action={setPlannedToday.bind(null, i.id, false)}>
                  <button
                    className="px-1 text-lg leading-none text-dim"
                    aria-label={`Von der Heute-Liste nehmen: ${i.title}`}
                  >
                    ×
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
