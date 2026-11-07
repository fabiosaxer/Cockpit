/** Master Caution: Warnleiste ganz oben. */
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
    { label: "Überfällig", value: overdue, on: "text-red glow-red", border: "border-red/60" },
    { label: "Heute", value: today, on: "text-amber glow-amber", border: "border-amber/50" },
    { label: "Im Anflug", value: approach, on: "text-cyan glow-cyan", border: "border-cyan/40" },
  ];

  return (
    <section className="space-y-2">
      {overdue > 0 ? (
        <div className="blink flex items-center justify-center gap-2 rounded-md border border-red/70 bg-red/10 py-1.5 font-mono text-xs font-bold tracking-[0.25em] text-red glow-red">
          MASTER WARNING · {overdue} ÜBERFÄLLIG
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-md border border-green/30 bg-green/5 py-1.5 font-mono text-xs tracking-[0.25em] text-green glow-green">
          ALL SYSTEMS NORMAL
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div
            key={c.label}
            className={`instrument flex flex-col items-center py-3 ${c.value > 0 ? c.border : ""}`}
          >
            <span className={`font-mono text-3xl tabular-nums ${c.value > 0 ? c.on : "text-dim/50"}`}>
              {String(c.value).padStart(2, "0")}
            </span>
            <span className="label mt-0.5">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
