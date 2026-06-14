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

  // Group bullets by project (AI classification)
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

  // If no AI projects, fall back to category-based view
  if (projects.size === 0) {
    const categoryGroups: ProjectGroup[] = [
      { name: '工作', bullets: [] },
      { name: '学习', bullets: [] },
      { name: '副业', bullets: [] },
    ];

    for (const entry of Object.values(entries)) {
      for (const bullet of entry.bullets.work) {
        categoryGroups[0]!.bullets.push({ date: entry.date, bulletId: bullet.id, text: bullet.text });
      }
      for (const bullet of entry.bullets.study) {
        categoryGroups[1]!.bullets.push({ date: entry.date, bulletId: bullet.id, text: bullet.text });
      }
      for (const bullet of entry.bullets.side) {
        categoryGroups[2]!.bullets.push({ date: entry.date, bulletId: bullet.id, text: bullet.text });
      }
    }

    const hasAnyBullets = categoryGroups.some((g) => g.bullets.length > 0);
    if (!hasAnyBullets) {
      return <p className="gantt-empty">本月暂无记录。在录入模式添加内容后，甘特图会自动显示活动分布。</p>;
    }

    return (
      <div className="gantt-chart" role="img" aria-label="活动甘特图">
        <p className="gantt-hint">按分类显示活动分布。使用「AI 分类项目」可按项目细分。</p>
        {categoryGroups.filter((g) => g.bullets.length > 0).map((group) => (
          <div key={group.name} className="gantt-row">
            <div className="gantt-label">{group.name}</div>
            <div className="gantt-bars">
              {group.bullets.map((bullet) => {
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
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="gantt-chart" role="img" aria-label="项目甘特图">
      {Array.from(projects.values()).map((project) => (
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
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
