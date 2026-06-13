import { useTimelineStore } from '../../store';
import { getMonthDays, calculateStreak, toDateKey } from '../../lib/date';
import { HeatmapCalendar } from '../stats/HeatmapCalendar';
import { ThemeManagementPanel } from '../../features/projects/ThemeManagementPanel';

export function StatsPanel() {
  const { selectedMonth, entries } = useTimelineStore();

  const entriesMap = entries;
  const entriesList = Object.values(entriesMap);
  const today = toDateKey(new Date());
  const streak = calculateStreak(entriesList, today);

  // Calculate monthly totals
  const monthEntries = getMonthDays(selectedMonth)
    .map((d) => entriesMap[d])
    .filter((e): e is NonNullable<typeof e> => !!e);

  const totals = {
    work: 0,
    study: 0,
    side: 0,
  };

  for (const entry of monthEntries) {
    totals.work += entry.bullets.work.length;
    totals.study += entry.bullets.study.length;
    totals.side += entry.bullets.side.length;
  }

  const totalBullets = totals.work + totals.study + totals.side;

  return (
    <div className="stats-panel">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Bullets</div>
          <div className="stat-card-value">{totalBullets}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Work</div>
          <div className="stat-card-value">{totals.work}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Study</div>
          <div className="stat-card-value">{totals.study}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Side</div>
          <div className="stat-card-value">{totals.side}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Current Streak</div>
          <div className="stat-card-value">{streak} day{streak !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <h3>Activity Heatmap</h3>
      <HeatmapCalendar month={selectedMonth} entries={entriesMap} />

      <ThemeManagementPanel />
    </div>
  );
}
