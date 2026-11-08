"use client";

import { useEffect, useRef } from "react";

/** Loest den Looping aus, wenn die Heute-Liste von "etwas offen" auf "alles erledigt" wechselt. */
export function CelebrateWatcher({ open }: { open: number }) {
  const prev = useRef(open);
  useEffect(() => {
    if (prev.current > 0 && open === 0) window.dispatchEvent(new Event("cockpit:celebrate"));
    prev.current = open;
  }, [open]);
  return null;
}
