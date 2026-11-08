/**
 * Fortschrittsbalken fuer das Kontingent in Mannschaften.
 * Gruen = gesichert, hellgruen = auf Kurs (Prognose), rot gestrichelt = fehlt bis zum Ziel.
 * Senkrechte Markierung = Ziel; was rechts davon liegt, ist Reserve.
 */
export function QuotaProgress({
  secured,
  onTrack,
  target,
  compact = false,
}: {
  secured: number;
  onTrack: number;
  target: number | null;
  compact?: boolean;
}) {
  const projected = secured + onTrack;
  const missing = target != null ? Math.max(0, target - projected) : 0;
  const reserve = target != null ? Math.max(0, projected - target) : 0;
  const total = Math.max(target ?? 0, projected, 1);
  const pct = (n: number) => `${(n / total) * 100}%`;
  const height = compact ? "h-2.5" : "h-7";

  return (
    <div className="space-y-1.5">
      <div className={`relative ${!compact && target ? "pt-4" : ""}`}>
        <div className={`relative flex ${height} overflow-hidden rounded-full bg-line/60`}>
          {secured > 0 && <div className="h-full bg-green" style={{ width: pct(secured) }} />}
          {onTrack > 0 && (
            <div
              className="h-full"
              style={{
                width: pct(onTrack),
                backgroundColor: "#a7e6c6",
                boxShadow: "inset 0 0 0 1.5px rgba(18,162,106,0.5)",
              }}
            />
          )}
          {missing > 0 && (
            <div
              className="h-full"
              style={{
                width: pct(missing),
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(240,80,90,0.28) 0 5px, rgba(240,80,90,0.08) 5px 10px)",
                boxShadow: "inset 0 0 0 1.5px rgba(240,80,90,0.55)",
                borderRadius: "0 9999px 9999px 0",
              }}
            />
          )}
          {/* Trennlinien pro Mannschaft */}
          {!compact && total <= 30 && (
            <div className="pointer-events-none absolute inset-0 flex">
              {Array.from({ length: total }, (_, i) => (
                <div key={i} className="h-full flex-1 border-r border-white/70 last:border-r-0" />
              ))}
            </div>
          )}
        </div>

        {/* Ziel-Markierung */}
        {target != null && target > 0 && (
          <div
            className={`absolute -bottom-1 ${!compact ? "top-3" : "-top-1"}`}
            style={{ left: `calc(${pct(target)} - 1.5px)` }}
          >
            <div className="h-full w-[3px] rounded-full bg-ink" />
            {!compact && (
              <span
                className={`absolute bottom-full mb-0.5 text-[0.65rem] font-extrabold whitespace-nowrap text-ink ${
                  target / total > 0.85 ? "right-0" : "left-1/2 -translate-x-1/2"
                }`}
              >
                Ziel {target}
              </span>
            )}
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs font-semibold">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-green" /> Gesichert {secured}
          </span>
          {onTrack > 0 && (
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full border-[1.5px] border-green/60 bg-[#a7e6c6]" /> Auf Kurs +{onTrack}
            </span>
          )}
          {missing > 0 && (
            <span className="flex items-center gap-1 text-red">
              <span className="size-2.5 rounded-full border-[1.5px] border-red bg-red/20" /> Fehlt {missing}
            </span>
          )}
          {reserve > 0 && <span className="text-green">Reserve +{reserve}</span>}
        </div>
      )}
    </div>
  );
}
