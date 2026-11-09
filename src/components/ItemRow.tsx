import Link from "next/link";
import { completeItem, prepareEvent, setPlannedToday } from "@/app/actions";
import { formatShort } from "@/lib/dates";
import { countdown, recurLabel, type ClassifiedItem, type ItemState } from "@/lib/logic";
import { AreaChip } from "./AreaChip";
import { PlanButton } from "./PlanButton";
import { DoneButton } from "./SubmitButton";

export const STATE_STYLE: Record<ItemState, { text: string; pill: string; bar: string; label: string }> = {
  overdue: { text: "text-red", pill: "bg-red text-white", bar: "bg-red", label: "Überfällig" },
  today: { text: "text-amber", pill: "bg-sun text-ink", bar: "bg-sun", label: "Heute" },
  approach: { text: "text-cyan", pill: "bg-cyan/12 text-cyan", bar: "bg-cyan", label: "Demnächst" },
  later: { text: "text-dim", pill: "bg-line/70 text-dim", bar: "bg-line", label: "Später" },
  done: { text: "text-green", pill: "bg-green/15 text-green", bar: "bg-green", label: "Erledigt" },
};

export function ItemRow({
  item,
  typeName,
  projectName,
  areaCode,
  back = "/",
}: {
  item: ClassifiedItem;
  typeName?: string;
  projectName?: string;
  areaCode?: string;
  back?: string;
}) {
  const s = STATE_STYLE[item.state];
  const recur = recurLabel(item.recur_every, item.recur_unit);
  const planned = !!item.planned_for;

  // Termin aus Outlook: nur anzeigen, Bearbeiten in Outlook
  if (item.event) {
    const body = (
      <>
        <div className="truncate font-semibold">{item.title}</div>
        <div className="flex items-center gap-1.5 truncate text-xs text-dim">
          {areaCode && <AreaChip code={areaCode} />}
          <span>{formatShort(item.due_date)}</span>
          <span>· {item.event.time ? `${item.event.time} Uhr` : "ganztägig"}</span>
          <span>· Outlook</span>
        </div>
      </>
    );
    return (
      <li className="flex items-center gap-3 py-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
          </svg>
        </span>
        {item.event.webLink ? (
          <a href={item.event.webLink} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
            {body}
          </a>
        ) : (
          <div className="min-w-0 flex-1">{body}</div>
        )}
        <form action={prepareEvent.bind(null, item.title, item.area_id, item.due_date)}>
          <PlanButton active={false} label={`${item.title} vorbereiten`} />
        </form>
        <span className={`chip shrink-0 tabular-nums ${s.pill}`}>{countdown(item.days)}</span>
      </li>
    );
  }

  // Termine werden nicht selbst eingeplant, sondern bekommen eine Aufgabe "Vorbereiten: ..."
  const isAppointment = typeName === "Termin";

  return (
    <li className="flex items-center gap-3 py-2.5">
      <form action={completeItem.bind(null, item.id)}>
        <DoneButton label={item.title} />
      </form>
      <Link href={`/eintrag/${item.id}?back=${encodeURIComponent(back)}`} className="min-w-0 flex-1">
        <div className="truncate font-semibold">{item.title}</div>
        <div className="flex items-center gap-1.5 truncate text-xs text-dim">
          {areaCode && <AreaChip code={areaCode} />}
          <span>{formatShort(item.due_date)}</span>
          {projectName ? <span className="truncate">· {projectName}</span> : typeName && <span>· {typeName}</span>}
          {recur && <span>· ↻ {recur}</span>}
        </div>
        {item.deadline && (
          <div className="mt-0.5 text-xs font-bold text-red">Kritisch · Frist {formatShort(item.deadline)}</div>
        )}
        {item.conflict && (
          <div className="mt-0.5 text-xs font-bold text-magenta">
            Während oder kurz nach „{item.conflict.title}“ fällig
          </div>
        )}
      </Link>
      {/* Sonne: bei Terminen vorbereiten, bei Aufgaben nur zum Vorziehen (nicht wenn heute faellig oder ueberfaellig) */}
      {item.state !== "done" &&
        (isAppointment ? (
          item.days >= 0 && (
            <form action={prepareEvent.bind(null, item.title, item.area_id, item.due_date)}>
              <PlanButton active={false} label={`${item.title} vorbereiten`} />
            </form>
          )
        ) : item.days > 0 ? (
          <form action={setPlannedToday.bind(null, item.id, !planned)}>
            <PlanButton active={planned} label={item.title} />
          </form>
        ) : (
          <span className="size-7 shrink-0" aria-hidden="true" />
        ))}
      <span className={`chip shrink-0 tabular-nums ${s.pill}`}>{countdown(item.days)}</span>
    </li>
  );
}
