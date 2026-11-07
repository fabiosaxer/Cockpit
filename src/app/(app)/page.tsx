import { AbsenceBanner } from "@/components/AbsenceBanner";
import { AreaTile } from "@/components/AreaTile";
import { QuickAdd } from "@/components/QuickAdd";
import { QuotaSummary } from "@/components/QuotaSection";
import { StatusBar } from "@/components/StatusBar";
import { loadCockpit } from "@/lib/data";
import { classifyAll } from "@/lib/logic";

export default async function CockpitPage() {
  const { areas, types, items, projects, absences, today } = await loadCockpit();
  const all = classifyAll(items, types, today, absences);
  const count = (s: string) => all.filter((i) => i.state === s).length;

  return (
    <div className="space-y-4">
      <StatusBar overdue={count("overdue")} today={count("today")} approach={count("approach")} />
      <AbsenceBanner absences={absences} today={today} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <AreaTile
            key={area.id}
            area={area}
            items={all.filter((i) => i.area_id === area.id)}
            projects={projects.filter((p) => p.area_id === area.id)}
            types={types}
            extra={area.code === "FCZ" ? <QuotaSummary today={today} /> : undefined}
          />
        ))}
      </div>
      <QuickAdd areas={areas} types={types} projects={projects} today={today} />
    </div>
  );
}
