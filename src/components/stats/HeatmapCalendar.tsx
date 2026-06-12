import { getMonthDays } from '../../lib/date';
import type { Entry } from '../../lib/schema';

interface HeatmapCalendarProps {
  month: string;
  entries: Record<string, Entry>;
}

function getBulletCount(entry: Entry | undefined): number {
  if (!entry) return 0;
  return entry.bullets.work.length + entry.bullets.study.length + entry.bullets.side.length;
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function HeatmapCalendar({ month, entries }: HeatmapCalendarProps) {
  const days = getMonthDays(month);

  return (
    <div className="heatmap-calendar" role="grid" aria-label="Activity heatmap">
      {days.map((day) => {
        const entry = entries[day];
        const count = getBulletCount(entry);
        const level = getLevel(count);
        const dayNum = day.split('-')[2];

        return (
          <div
            key={day}
            className="heatmap-day"
            data-level={level}
            title={`${day}: ${count} bullet${count !== 1 ? 's' : ''}`}
            aria-label={`${day}: ${count} bullets`}
          >
            <span className="heatmap-day-label">{dayNum}</span>
          </div>
        );
      })}
    </div>
  );
}
