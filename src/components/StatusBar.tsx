/** Kurze Lagezeile ueber dem Zeitstrahl. */
export function StatusBar({ overdue, today }: { overdue: number; today: number }) {
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
  return <p className="text-lg font-extrabold text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">{text}</p>;
}
