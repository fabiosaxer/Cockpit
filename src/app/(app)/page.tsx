import { AbsenceBanner } from "@/components/AbsenceBanner";
import { AreaTile } from "@/components/AreaTile";
import { ProjectSummary } from "@/components/ProjectCard";
import { QuickAdd } from "@/components/QuickAdd";
import { QuotaSummary } from "@/components/QuotaSection";
import { StatusBar } from "@/components/StatusBar";
import { Timeline } from "@/components/Timeline";
import { loadCockpit, loadOutlookItems } from "@/lib/data";
import { classifyAll } from "@/lib/logic";

export default async function CockpitPage() {
  const { areas, types, items, projects, absences, milestones, modules, today } = await loadCockpit();
  const outlook = await loadOutlookItems(areas);
  const all = classifyAll([...items, ...outlook.items], types, today, absences);
  const count = (s: string) => all.filter((i) => i.state === s).length;

  return (
    <div className="space-y-4">
      <StatusBar overdue={count("overdue")} today={count("today")} />
      <Timeline items={all} areas={areas} today={today} />
      <AbsenceBanner absences={absences} today={today} />
      {(outlook.status === "relogin" || outlook.status === "error") && (
        <a href="/einstellungen" className="instrument block px-4 py-3 text-sm font-semibold text-red">
          Outlook-Termine konnten nicht geladen werden. Zu den Einstellungen ›
        </a>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <AreaTile
            key={area.id}
            area={area}
            items={all.filter((i) => i.area_id === area.id)}
            projects={projects.filter((p) => p.area_id === area.id)}
            types={types}
            modules={modules}
            extra={area.code === "FCZ" ? <QuotaSummary today={today} /> : undefined}
          />
        ))}
      </div>
      {projects.length > 0 && (
        <section className="space-y-2">
          <h2 className="label px-1">Projekte</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...projects]
              .sort((a, b) => ({ red: 0, amber: 1, green: 2 })[a.status] - ({ red: 0, amber: 1, green: 2 })[b.status])
              .map((p) => (
                <ProjectSummary
                  key={p.id}
                  project={p}
                  milestones={milestones.filter((m) => m.project_id === p.id)}
                  areaCode={areas.find((a) => a.id === p.area_id)?.code}
                  today={today}
                />
              ))}
          </div>
        </section>
      )}
      <QuickAdd areas={areas} types={types} projects={projects} modules={modules} today={today} />
    </div>
  );
}
