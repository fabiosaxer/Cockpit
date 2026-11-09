import { todayTasks, type ClassifiedItem } from "@/lib/logic";
import type { Area, ItemType } from "@/lib/types";
import { TodaySortable } from "./TodaySortable";

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
  const list = todayTasks(items, types, today);
  if (!list.length) return null;

  return (
    <section className="instrument overflow-hidden border-2 border-sun">
      <div className="flex items-center justify-between bg-gradient-to-r from-sun/40 to-sun/10 px-4 py-2.5">
        <h2 className="font-black">Heute erledigen</h2>
        <span className="chip bg-white text-amber">{list.length}</span>
      </div>
      <TodaySortable
        today={today}
        areas={areas.map((a) => ({ id: a.id, code: a.code }))}
        items={list.map((i) => ({
          id: i.id,
          title: i.title,
          area_id: i.area_id,
          due_date: i.due_date,
          planned_for: i.planned_for ?? null,
        }))}
      />
    </section>
  );
}
