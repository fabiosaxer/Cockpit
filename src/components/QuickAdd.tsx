"use client";

import { useState } from "react";
import { createItem } from "@/app/actions";
import { ItemForm, type ItemFormProps } from "./ItemForm";

/** Schwebender Knopf unten rechts, oeffnet die Schnellerfassung. */
export function QuickAdd(props: Omit<ItemFormProps, "action" | "submitLabel">) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  async function submit(fd: FormData) {
    await createItem(fd);
    setOpen(false);
    setKey((k) => k + 1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Neuer Eintrag"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 grid size-16 place-items-center rounded-full bg-gradient-to-b from-[#ffd75e] to-[#ffb800] text-4xl font-black leading-none text-ink shadow-[0_12px_28px_-8px_rgba(224,134,0,0.7)] ring-4 ring-white transition active:scale-95 sm:bottom-6"
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#0b3a63]/40 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="instrument max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 sm:rounded-b-[22px] pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="text-lg font-black">✈️ Neuer Eintrag</span>
              <button type="button" onClick={() => setOpen(false)} className="label" aria-label="Schliessen">
                ✕
              </button>
            </div>
            <ItemForm key={key} {...props} action={submit} submitLabel="Eintragen" autoFocus />
          </div>
        </div>
      )}
    </>
  );
}
