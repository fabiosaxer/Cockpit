import Link from "next/link";
import { completeItem } from "@/app/actions";
import { formatShort } from "@/lib/dates";
import { countdown, recurLabel, type ClassifiedItem, type ItemState } from "@/lib/logic";
import { DoneButton } from "./SubmitButton";

export const STATE_STYLE: Record<ItemState, { text: string; bar: string; label: string }> = {
  overdue: { text: "text-red glow-red", bar: "bg-red", label: "Überfällig" },
  today: { text: "text-amber glow-amber", bar: "bg-amber", label: "Heute" },
  approach: { text: "text-cyan glow-cyan", bar: "bg-cyan", label: "Im Anflug" },
  later: { text: "text-dim", bar: "bg-line", label: "Später" },
  done: { text: "text-green", bar: "bg-green", label: "Gelandet" },
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
    <li className="flex items-center gap-3 py-2">
      <form action={completeItem.bind(null, item.id)}>
        <DoneButton label={item.title} />
      </form>
      <Link href={`/eintrag/${item.id}?back=${encodeURIComponent(back)}`} className="min-w-0 flex-1">
        <div className="truncate">{item.title}</div>
        <div className="truncate font-mono text-[0.7rem] text-dim">
          {areaCode && <span className="text-cyan">{areaCode} · </span>}
          {formatShort(item.due_date)}
          {typeName && ` · ${typeName}`}
          {recur && ` · ↻ ${recur}`}
        </div>
      </Link>
      <span className={`shrink-0 font-mono text-sm tabular-nums ${s.text}`}>{countdown(item.days)}</span>
    </li>
  );
}
