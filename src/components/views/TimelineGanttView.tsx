import { useTimelineStore } from '../../store';
import { GanttChart } from '../stats/GanttChart';
import { Button } from '../primitives/Button';

export function TimelineGanttView() {
  const { selectedMonth, entries } = useTimelineStore();

  // Check if any entries have projects
  const hasProjects = Object.values(entries).some((e) => e.ai?.projects && e.ai.projects.length > 0);

  return (
    <div className="timeline-gantt-view">
      <div style={{ marginBottom: '1rem' }}>
        <Button variant="secondary">Classify Projects</Button>
      </div>
      <GanttChart month={selectedMonth} entries={entries} />
    </div>
  );
}
