import { useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { DayCard } from '../cards/DayCard';
import { toDateKey } from '../../lib/date';
import type { Entry } from '../../lib/schema';

interface MonthGroup {
  monthKey: string;
  label: string;
  days: string[];
}

export function TimelineView() {
  const entries = useTimelineStore((s) => s.entries);

  // Group all dates by month, in reverse chronological order
  const monthGroups = useMemo(() => {
    const groups = buildMonthGroups(entries);
    return groups;
  }, [entries]);

  return (
    <div className="timeline-view">
      {monthGroups.map((group) => (
        <div key={group.monthKey} className="timeline-month-section">
          <div className="timeline-month-header">
            <h2 className="timeline-month-title">{group.label}</h2>
            <span className="timeline-month-count">{group.days.length} days</span>
          </div>
          <div className="timeline-month-days">
            {group.days.map((date) => (
              <DayCard key={date} date={date} />
            ))}
          </div>
        </div>
      ))}

      {monthGroups.length === 0 && (
        <div className="timeline-empty">
          <p>No entries yet. Start by adding bullets in the Checkin tab.</p>
        </div>
      )}
    </div>
  );
}

/** Build month groups from all entries, sorted reverse chronologically */
function buildMonthGroups(entries: Record<string, Entry>): MonthGroup[] {
  const today = toDateKey(new Date());
  const allDates = new Set<string>();

  // Collect all dates from entries
  for (const date of Object.keys(entries)) {
    allDates.add(date);
  }

  // Also include today if not already present
  allDates.add(today);

  // Group dates by month
  const monthMap = new Map<string, string[]>();
  for (const date of allDates) {
    const monthKey = date.slice(0, 7); // YYYY-MM
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(date);
  }

  // Sort months reverse chronologically
  const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));

  // Build groups with sorted days
  return sortedMonths.map((monthKey) => {
    const days = monthMap.get(monthKey)!.sort((a, b) => b.localeCompare(a));
    const [year, month] = monthKey.split('-');
    const label = formatMonthLabel(Number(year), Number(month));
    return { monthKey, label, days };
  });
}

function formatMonthLabel(year: number, month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[month - 1]} ${year}`;
}
