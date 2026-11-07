import type { ProjectStatus } from "@/lib/types";

const COLORS: Record<ProjectStatus, string> = {
  green: "bg-green shadow-[0_0_8px_rgba(62,224,131,0.7)]",
  amber: "bg-amber shadow-[0_0_8px_rgba(255,180,34,0.7)]",
  red: "bg-red shadow-[0_0_8px_rgba(255,79,79,0.8)]",
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  green: "Auf Kurs",
  amber: "Achtung",
  red: "Kritisch",
};

export function StatusLight({ status, size = "size-2.5" }: { status: ProjectStatus; size?: string }) {
  return <span aria-label={STATUS_LABEL[status]} className={`inline-block shrink-0 rounded-full ${size} ${COLORS[status]}`} />;
}
