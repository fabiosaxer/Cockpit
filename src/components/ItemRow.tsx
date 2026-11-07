import Link from "next/link";
import { completeItem } from "@/app/actions";
import { formatShort } from "@/lib/dates";
import { countdown, recurLabel, type ClassifiedItem, type ItemState } from "@/lib/logic";
import { AreaChip } from "./AreaChip";
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
  areaCode,
  back = "/",
}: {
  item: ClassifiedItem;
  typeName?: string;
  areaCode?: string;
  back?: string;
}) {
  const s = STATE_STYLE[item.state];
  const recur = recurLabel(item.recur_every, item.recur_unit);
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
          {typeName && <span>· {typeName}</span>}
          {recur && <span>· ↻ {recur}</span>}
        </div>
        {item.conflict && (
          <div className="mt-0.5 text-xs font-bold text-magenta">
            Während oder kurz nach „{item.conflict.title}“ fällig
          </div>
        )}
      </Link>
      <span className={`chip shrink-0 tabular-nums ${s.pill}`}>{countdown(item.days)}</span>
    </li>
  );
}
