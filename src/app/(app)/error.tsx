"use client";

import { useEffect } from "react";

/** Statt weissem Bildschirm: kurzer Hinweis mit Neu-Laden. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="instrument mx-auto mt-6 max-w-md space-y-3 p-6 text-center">
      <div className="text-lg font-black">Kurze Turbulenz</div>
      <p className="text-sm text-dim">
        Beim Laden ist etwas schiefgelaufen. Meist hilft neu laden. Falls nicht, fehlt eventuell noch eine
        Datenbank-Migration.
      </p>
      {error.digest && <p className="font-mono text-xs text-dim">Code {error.digest}</p>}
      <div className="flex justify-center gap-2">
        <button onClick={() => reset()} className="btn btn-primary">
          Nochmals versuchen
        </button>
        <button onClick={() => window.location.reload()} className="btn">
          Neu laden
        </button>
      </div>
    </div>
  );
}
