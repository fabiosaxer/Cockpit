"use client";

import { useState } from "react";
import { createIpaCandidate } from "@/app/actions";
import { PROFESSION_LABEL, type IpaProfession } from "@/lib/ipa";
import { SubmitButton } from "./SubmitButton";

export function IpaForm() {
  const [profession, setProfession] = useState<IpaProfession>("informatiker");
  const ict = profession === "ict";

  return (
    <form action={createIpaCandidate} className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(PROFESSION_LABEL) as IpaProfession[]).map((p) => (
          <label
            key={p}
            className={`cursor-pointer rounded-2xl border-2 px-3 py-2 text-center text-sm font-bold ${
              profession === p ? "border-cyan bg-cyan/8 text-cyan" : "border-line text-dim"
            }`}
          >
            <input
              type="radio"
              name="profession"
              value={p}
              checked={profession === p}
              onChange={() => setProfession(p)}
              className="sr-only"
            />
            {PROFESSION_LABEL[p]}
          </label>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="label">Kürzel (keine vollen Namen)</span>
        <input name="code" required maxLength={8} placeholder="z.B. AB" className="field uppercase" />
      </label>

      {ict ? (
        <label className="block space-y-1">
          <span className="label">Durchführungstag</span>
          <input type="date" name="start_date" required className="field" />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="label">Start IPA</span>
              <input type="date" name="start_date" required className="field" />
            </label>
            <label className="block space-y-1">
              <span className="label">Ende / Abgabe</span>
              <input type="date" name="end_date" required className="field" />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="label">Präsentation (leer = ca. 3 Wochen nach Abgabe)</span>
            <input type="date" name="presentation_date" className="field" />
          </label>
        </>
      )}

      <SubmitButton className="btn btn-primary w-full" pendingText="Lege an…">
        Kandidat und Fixpunkte anlegen
      </SubmitButton>
      <p className="text-xs text-dim">
        {ict
          ? "Angelegt werden: Validierungsgespräch (ca. eine Woche vorher) und Durchführungstag."
          : "Angelegt werden: Validierungsgespräch (2 Arbeitstage vor Start), Besuch 1 (2. Tag), Besuch 2 (Mitte), Abgabe, Korrektur & Fachfragen (sichtbar ab Abgabe) und Präsentation."}{" "}
        Jeder Fixpunkt lässt sich danach einzeln verschieben.
      </p>
    </form>
  );
}
