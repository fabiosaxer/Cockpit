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
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full border border-cyan bg-cyan text-3xl leading-none text-[#031016] shadow-[0_0_24px_rgba(63,216,242,0.35)] sm:bottom-6"
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="instrument max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-b-[10px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-mono text-sm tracking-[0.2em] text-cyan">NEUER EINTRAG</span>
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
