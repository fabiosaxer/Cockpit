import { AbsenceBanner } from "@/components/AbsenceBanner";
import { CelebrateWatcher } from "@/components/CelebrateWatcher";
import { AreaTile } from "@/components/AreaTile";
import { ProjectSummary } from "@/components/ProjectCard";
import { QuickAdd } from "@/components/QuickAdd";
import { QuotaSummary } from "@/components/QuotaSection";
import { StatusBar } from "@/components/StatusBar";
import { Timeline } from "@/components/Timeline";
import { TodayList } from "@/components/TodayList";
import { loadCockpit, loadOutlookItems, loadOverdueHistory } from "@/lib/data";
import { classifyAll, overdueFreeDays, todayTasks } from "@/lib/logic";

export default async function CockpitPage() {
  const { areas, types, items, projects, absences, milestones, modules, today } = await loadCockpit();
  const [outlook, history] = await Promise.all([loadOutlookItems(areas), loadOverdueHistory()]);
  const all = classifyAll([...items, ...outlook.items], types, today, absences);
  // Ruhige Termine (z.B. Lektionen) zaehlen nicht in der Lagezeile
  const count = (s: string) => all.filter((i) => i.state === s && !i.event?.quiet).length;

  return (
    <div className="space-y-4">
      <StatusBar
        overdue={count("overdue")}
        today={count("today")}
        streak={overdueFreeDays(history.done, items.some((i) => i.due_date < today), today, history.firstDay)}
      />
      <CelebrateWatcher open={todayTasks(items, types, today).length} />
      <TodayList items={all} types={types} areas={areas} today={today} />
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
