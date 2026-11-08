"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  // Hintergrund nicht mitscrollen, solange das Formular offen ist
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

      {/* Ueber ein Portal direkt in <body>, damit nichts (z.B. die Navigation) darueber liegt */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0b3a63]/40 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Neuer Eintrag"
              className="instrument flex max-h-[92dvh] w-full max-w-lg flex-col rounded-b-none sm:rounded-b-[22px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <span className="text-lg font-black">Neuer Eintrag</span>
                <button type="button" onClick={() => setOpen(false)} className="label p-1" aria-label="Schliessen">
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <ItemForm key={key} {...props} action={submit} submitLabel="Eintragen" autoFocus stickySubmit />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
