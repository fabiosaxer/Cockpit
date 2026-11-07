"use client";

import { useState } from "react";
import type { Area, Item, ItemType, Project } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

export type ItemFormProps = {
  areas: Area[];
  types: ItemType[];
  projects: Project[];
  today: string;
  item?: Item;
  defaultAreaId?: string;
  action: (fd: FormData) => void | Promise<void>;
  submitLabel: string;
  back?: string;
  autoFocus?: boolean;
};

export function ItemForm({
  areas,
  types,
  projects,
  today,
  item,
  defaultAreaId,
  action,
  submitLabel,
  back,
  autoFocus,
}: ItemFormProps) {
  const [areaId, setAreaId] = useState(item?.area_id ?? defaultAreaId ?? areas[0]?.id ?? "");
  const [typeId, setTypeId] = useState(item?.type_id ?? types.find((t) => t.name === "Aufgabe")?.id ?? "");
  const [more, setMore] = useState(
    !!item && (item.lead_days != null || !!item.recur_every || !!item.note || !!item.project_id),
  );
  const typeLead = types.find((t) => t.id === typeId)?.lead_days ?? 0;
  const areaProjects = projects.filter((p) => p.area_id === areaId);

  return (
    <form action={action} className="space-y-3">
      {back && <input type="hidden" name="back" value={back} />}
      <label className="block space-y-1">
        <span className="label">Titel</span>
        <input name="title" required defaultValue={item?.title} autoFocus={autoFocus} className="field" placeholder="z.B. Abgabe Fallstudie" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="label">Bereich</span>
          <select name="area_id" value={areaId} onChange={(e) => setAreaId(e.target.value)} className="field">
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="label">Typ</span>
          <select name="type_id" value={typeId} onChange={(e) => setTypeId(e.target.value)} className="field">
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="label">Fällig am</span>
        <input type="date" name="due_date" required defaultValue={item?.due_date ?? today} className="field" />
        <span className="block font-mono text-[0.7rem] text-cyan">
          Sichtbar ab {item?.lead_days ?? typeLead} Tagen vorher {item?.lead_days == null && "(Standard des Typs)"}
        </span>
      </label>

      <button type="button" onClick={() => setMore((m) => !m)} className="label text-cyan">
        {more ? "▾ Weniger" : "▸ Vorlauf, Wiederholung, Projekt, Notiz"}
      </button>

      {more && (
        <div className="space-y-3 rounded-md border border-line/70 p-3">
          <label className="block space-y-1">
            <span className="label">Vorlauf in Tagen (leer = Standard {typeLead})</span>
            <input type="number" min={0} name="lead_days" inputMode="numeric" defaultValue={item?.lead_days ?? ""} className="field" />
          </label>
          <div className="space-y-1">
            <span className="label">Wiederholen ab Erledigt-Datum</span>
            <div className="grid grid-cols-[5rem_1fr] gap-2">
              <input type="number" min={1} name="recur_every" inputMode="numeric" placeholder="–" defaultValue={item?.recur_every ?? ""} className="field" />
              <select name="recur_unit" defaultValue={item?.recur_unit ?? "week"} className="field">
                <option value="day">Tage</option>
                <option value="week">Wochen</option>
                <option value="month">Monate</option>
                <option value="year">Jahre</option>
              </select>
            </div>
          </div>
          {areaProjects.length > 0 && (
            <label className="block space-y-1">
              <span className="label">Projekt</span>
              <select name="project_id" defaultValue={item?.project_id ?? ""} className="field">
                <option value="">– kein Projekt –</option>
                {areaProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block space-y-1">
            <span className="label">Notiz</span>
            <textarea name="note" rows={2} defaultValue={item?.note ?? ""} className="field" />
          </label>
        </div>
      )}

      <SubmitButton className="btn btn-primary w-full" pendingText="Speichere…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
