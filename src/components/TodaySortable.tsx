"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { completeItem, reorderToday, setPlannedToday } from "@/app/actions";
import { areaColor } from "@/lib/areaColors";
import { diffDays, formatShort } from "@/lib/dates";
import { DoneButton } from "./SubmitButton";

type Row = { id: string; title: string; area_id: string; due_date: string; planned_for: string | null };

function SortableRow({ item, code, today }: { item: Row; code?: string; today: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const days = diffDays(item.due_date, today);
  const carried = !!item.planned_for && item.planned_for < today;
  const color = code ? areaColor(code) : undefined;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-white py-2.5 ${isDragging ? "relative z-10 rounded-xl shadow-lg ring-2 ring-sun" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Verschieben: ${item.title}`}
        className="-ml-1 grid h-9 w-5 shrink-0 cursor-grab touch-none place-items-center text-dim/50 active:cursor-grabbing"
      >
        <svg viewBox="0 0 8 14" className="h-3.5 w-2" fill="currentColor" aria-hidden="true">
          {[1, 5, 9, 13].map((y) => (
            <g key={y}>
              <circle cx="1.5" cy={y} r="1.2" />
              <circle cx="6.5" cy={y} r="1.2" />
            </g>
          ))}
        </svg>
      </button>
      <form action={completeItem.bind(null, item.id)}>
        <DoneButton label={item.title} />
      </form>
      <Link href={`/eintrag/${item.id}`} className="min-w-0 flex-1">
        <div className="truncate font-bold">{item.title}</div>
        <div className="flex items-center gap-1.5 text-xs text-dim">
          {code && color && (
            <span className="chip" style={{ color, backgroundColor: `${color}1a` }}>
              {code}
            </span>
          )}
          <span className={days < 0 ? "font-bold text-red" : ""}>
            {days === 0
              ? "fällig heute"
              : days < 0
                ? `seit ${formatShort(item.due_date)} überfällig`
                : `fällig ${formatShort(item.due_date)}`}
          </span>
          {carried && <span className="font-bold text-amber">· eingeplant {formatShort(item.planned_for!)}</span>}
        </div>
      </Link>
      {item.planned_for && item.due_date > today && (
        <form action={setPlannedToday.bind(null, item.id, false)}>
          <button className="px-1 text-lg leading-none text-dim" aria-label={`Von der Heute-Liste nehmen: ${item.title}`}>
            ×
          </button>
        </form>
      )}
    </li>
  );
}

/** Heute-Liste mit Sortieren per Ziehen am Griff; die Reihenfolge wird gespeichert. */
export function TodaySortable({
  items,
  areas,
  today,
}: {
  items: Row[];
  areas: { id: string; code: string }[];
  today: string;
}) {
  const [rows, setRows] = useState(items);
  const [, startTransition] = useTransition();

  // neue Daten vom Server uebernehmen (z.B. nach Erledigt)
  useEffect(() => setRows(items), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((r) => r.id === active.id);
    const to = rows.findIndex((r) => r.id === over.id);
    const next = arrayMove(rows, from, to);
    setRows(next);
    startTransition(() => reorderToday(next.map((r) => r.id)));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-line px-4">
          {rows.map((r) => (
            <SortableRow key={r.id} item={r} code={areas.find((a) => a.id === r.area_id)?.code} today={today} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
