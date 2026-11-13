/** Sofortige Rueckmeldung beim Navigieren, bis die Daten da sind. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Lädt">
      <div className="h-7 w-2/3 animate-pulse rounded-full bg-white/40" />
      <div className="instrument h-40 animate-pulse opacity-70" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="instrument h-48 animate-pulse opacity-70" />
        ))}
      </div>
    </div>
  );
}
