import { useTimelineStore } from '../../store';
import { exportGoalAsMarkdown } from '../../services/projectArchive';
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

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflect-flow-${goal.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="btn btn-secondary" onClick={handleExport}>
      导出项目档案 (Markdown)
    </button>
  );
}
