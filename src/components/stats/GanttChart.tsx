import { getMonthDays } from '../../lib/date';
import type { Entry } from '../../lib/schema';

interface GanttChartProps {
  month: string;
  entries: Record<string, Entry>;
}

interface ProjectGroup {
  name: string;
  bullets: Array<{ date: string; bulletId: string; text: string }>;
}

export function GanttChart({ month, entries }: GanttChartProps) {
  const days = getMonthDays(month);
  const dayWidth = 100 / days.length;

  // Group bullets by project
  const projects = new Map<string, ProjectGroup>();
  for (const entry of Object.values(entries)) {
    if (entry.ai?.projects) {
      for (const project of entry.ai.projects) {
        if (!projects.has(project.name)) {
          projects.set(project.name, { name: project.name, bullets: [] });
        }
        for (const ref of project.bulletRefs) {
          const bullet = entry.bullets.work.find((b) => b.id === ref.bulletId)
            ?? entry.bullets.study.find((b) => b.id === ref.bulletId)
            ?? entry.bullets.side.find((b) => b.id === ref.bulletId);
          if (bullet) {
            projects.get(project.name)!.bullets.push({
              date: entry.date,
              bulletId: bullet.id,
              text: bullet.text,
            });
          }
        }
      }
    }
  }

  const projectList = Array.from(projects.values());

  if (projectList.length === 0) {
    return <p>No projects classified yet. Use "Classify Projects" to assign bullets.</p>;
  }

  return (
    <div className="gantt-chart" role="img" aria-label="Project timeline">
      {projectList.map((project) => (
        <div key={project.name} className="gantt-row">
          <div className="gantt-label">{project.name}</div>
          <div className="gantt-bars">
            {project.bullets.map((bullet) => {
              const dayIndex = days.indexOf(bullet.date);
              if (dayIndex === -1) return null;
              return (
                <div
                  key={bullet.bulletId}
                  className="gantt-bar"
                  style={{
                    left: `${dayIndex * dayWidth}%`,
                    width: `${dayWidth}%`,
                  }}
                  title={`${bullet.date}: ${bullet.text}`}
                  aria-label={`${project.name} - ${bullet.date}: ${bullet.text}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
