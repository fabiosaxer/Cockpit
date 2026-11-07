/** Lage auf einen Blick: Begruessung plus drei grosse Anzeigen. */
export function StatusBar({
  overdue,
  today,
  approach,
}: {
  overdue: number;
  today: number;
  approach: number;
}) {
  const cells = [
    { label: "Überfällig", value: overdue, color: "#f0505a", icon: "M12 8v5M12 16.5v.5M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" },
    { label: "Heute", value: today, color: "#f2a900", icon: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
    { label: "Im Anflug", value: approach, color: "#0b8ad6", icon: "M2.5 19h19M3 13.5l3 .8 3.2-2.4-6-4 1.7-.6 8.3 2.6 4.2-2.2a1.8 1.8 0 0 1 1.7 3.2L7.3 17.2z" },
  ];

  let headline: React.ReactNode;
  if (overdue > 0) {
    headline = (
      <>
        <span className="blink inline-block">⚠️</span> {overdue} {overdue === 1 ? "Punkt ist" : "Punkte sind"} überfällig. Zeit zum Durchstarten!
      </>
    );
  } else if (today > 0) {
    headline = <>☀️ {today} {today === 1 ? "Sache steht" : "Sachen stehen"} heute an. Guten Flug!</>;
  } else {
    headline = <>✈️ Alles auf Kurs. Geniess den Reiseflug!</>;
  }

  return (
    <section className="space-y-3">
      <p className="text-lg font-extrabold text-white drop-shadow-[0_1px_2px_rgba(10,60,110,0.35)]">{headline}</p>
      <div className="grid grid-cols-3 gap-2.5">
        {cells.map((c) => (
          <div key={c.label} className="instrument flex flex-col items-center gap-1 px-1 py-3.5">
            <span
              className="grid size-9 place-items-center rounded-full"
              style={{ backgroundColor: c.value ? `${c.color}22` : "#eef4fa", color: c.value ? c.color : "#a9bacb" }}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={c.icon} />
              </svg>
            </span>
            <span className="text-3xl font-black tabular-nums" style={{ color: c.value ? c.color : "#b7c6d5" }}>
              {c.value}
            </span>
            <span className="label text-[0.65rem]">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
