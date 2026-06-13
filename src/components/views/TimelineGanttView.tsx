import { useTimelineStore } from '../../store';
import { GanttChart } from '../stats/GanttChart';
import { ThemeManagementPanel } from '../../features/projects/ThemeManagementPanel';

export function TimelineGanttView() {
  const { selectedMonth, entries } = useTimelineStore();

  return (
    <div className="timeline-gantt-view">
      <ThemeManagementPanel />

      <div style={{ marginTop: '1rem' }}>
        <GanttChart month={selectedMonth} entries={entries} />
      </div>
    </div>
  );
}
