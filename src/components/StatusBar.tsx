/** Kurze Lagezeile ueber dem Zeitstrahl. */
export function StatusBar({ overdue, today, streak = 0 }: { overdue: number; today: number; streak?: number }) {
  let text: string;
  if (overdue > 0) {
    text = `${overdue} ${overdue === 1 ? "Punkt ist" : "Punkte sind"} überfällig${
      today > 0 ? `, heute ${today === 1 ? "steht 1 Sache" : `stehen ${today} Sachen`} an` : ""
    }.`;
  } else if (today > 0) {
    text = `Heute ${today === 1 ? "steht 1 Sache" : `stehen ${today} Sachen`} an.`;
  } else {
    text = "Heute ist nichts fällig. Schönen Tag!";
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-lg font-extrabold text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">{text}</p>
      {streak >= 2 && (
        <span
          className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-green shadow"
          title="Tage ohne überfällige Einträge"
        >
          {streak} Tage ohne Überfälliges
        </span>
      )}
    </div>
  );
}
