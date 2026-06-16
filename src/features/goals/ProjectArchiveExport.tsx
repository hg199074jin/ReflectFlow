import { useTimelineStore } from '../../store';
import { exportGoalAsMarkdown } from '../../services/projectArchive';
import { downloadBlob } from '../../services/export/download';
import type { Goal } from '../../lib/schema';

interface Props {
  goal: Goal;
}

export function ProjectArchiveExport({ goal }: Props) {
  const goalPlans = useTimelineStore(s => s.goalPlans);
  const goalFinalReports = useTimelineStore(s => s.goalFinalReports);
  const dailyGoalTargets = useTimelineStore(s => s.dailyGoalTargets);

  const handleExport = () => {
    const plan = Object.values(goalPlans).find(p => p.goalId === goal.id);
    const reports = Object.values(goalFinalReports).filter(r => r.goalId === goal.id);
    const targets = Object.values(dailyGoalTargets).filter(t => t.goalId === goal.id);

    const markdown = exportGoalAsMarkdown(goal, plan, reports, targets);
    downloadBlob(`reflect-flow-${goal.title}.md`, markdown, 'text/markdown');
  };

  return (
    <button className="btn btn-secondary" onClick={handleExport}>
      导出项目档案 (Markdown)
    </button>
  );
}
