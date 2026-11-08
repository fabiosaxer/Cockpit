import Link from "next/link";
import { archiveModule, createModule, renameModule } from "@/app/actions";
import { formatShort } from "@/lib/dates";
import { countdown, type ClassifiedItem } from "@/lib/logic";
import type { StudyModule } from "@/lib/types";
import { STATE_STYLE } from "./ItemRow";
import { SubmitButton } from "./SubmitButton";

/** Faecher des Semesters mit ihren offenen Abgaben und Pruefungen. */
export function ModulesSection({
  modules,
  items,
}: {
  modules: StudyModule[];
  items: ClassifiedItem[];
}) {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => {
          const list = items.filter((i) => i.module_id === m.id);
          return (
            <article key={m.id} className="instrument p-4">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <span className="font-black">{m.name}</span>
                {m.semester && <span className="text-xs text-dim">{m.semester}</span>}
              </div>
              {list.length ? (
                <ul className="mt-2 divide-y divide-line">
                  {list.map((i) => (
                    <li key={i.id}>
                      <Link
                        href={`/eintrag/${i.id}?back=/bereich/ZHAW`}
                        className="flex items-center gap-2 py-2 text-sm"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{i.title}</span>
                          <span className="text-xs text-dim">
                            {formatShort(i.due_date)}
                            {i.deadline && <span className="font-bold text-red"> · Frist {formatShort(i.deadline)}</span>}
                          </span>
                        </span>
                        <span className={`chip shrink-0 tabular-nums ${STATE_STYLE[i.state].pill}`}>
                          {countdown(i.days)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 px-1 text-sm text-dim">Keine offenen Punkte</p>
              )}
            </article>
          );
        })}
      </div>

      <details className="instrument p-4">
        <summary className="cursor-pointer px-1 text-sm font-bold text-cyan">Fächer verwalten</summary>
        <ul className="mt-3 space-y-2">
          {modules.map((m) => (
            <li key={m.id} className="grid grid-cols-[1fr_auto_auto] gap-2">
              <form action={renameModule.bind(null, m.id)} className="contents">
                <input name="name" defaultValue={m.name} className="field py-2" aria-label="Fach" />
                <SubmitButton className="btn px-3">OK</SubmitButton>
              </form>
              <form action={archiveModule.bind(null, m.id)}>
                <SubmitButton className="btn btn-danger px-3 text-xs">Abschliessen</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={createModule} className="mt-3 grid grid-cols-[1fr_5.5rem_auto] gap-2 border-t border-line pt-3">
          <input name="name" required placeholder="Neues Fach" className="field py-2" />
          <input name="semester" placeholder="FS27" className="field py-2" aria-label="Semester" />
          <SubmitButton className="btn btn-primary px-3">+</SubmitButton>
        </form>
        <p className="mt-2 px-1 text-xs text-dim">
          „Abschliessen“ blendet ein Fach nach dem Semester aus. Die Einträge bleiben erhalten.
        </p>
      </details>
    </section>
  );
}
