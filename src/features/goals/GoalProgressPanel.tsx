import { useTimelineStore } from '../../store';
import { calculateGoalProgress } from './goalUtils';
import { EvidenceList } from '../evidence/EvidenceList';
import { buildEvidenceRefs } from '../evidence/evidence';
import type { Goal } from '../../lib/schema';

interface GoalProgressPanelProps {
  goal: Goal;
}

export function GoalProgressPanel({ goal }: GoalProgressPanelProps) {
  const entries = useTimelineStore((s) => s.entries);
  const { linkedCount, activeDays } = calculateGoalProgress(goal, entries);
  const evidence = buildEvidenceRefs(entries, goal.linkedBullets);

  return (
    <div className="goal-progress-panel">
      <div className="goal-progress-stats">
        <div className="goal-progress-stat">
          <span className="goal-progress-value">{linkedCount}</span>
          <span className="goal-progress-label">Linked Bullets</span>
        </div>
        <div className="goal-progress-stat">
          <span className="goal-progress-value">{activeDays}</span>
          <span className="goal-progress-label">Active Days</span>
        </div>
      </div>

      {goal.notes && (
        <div className="goal-progress-notes">
          <h4>Notes</h4>
          <p>{goal.notes}</p>
        </div>
      )}

      {goal.ai?.progressSummary && (
        <div className="goal-progress-ai">
          <h4>AI Progress Summary</h4>
          <p>{goal.ai.progressSummary}</p>
        </div>
      )}

      {evidence.length > 0 && (
        <div className="goal-progress-evidence">
          <h4>Linked Evidence</h4>
          <EvidenceList evidence={evidence} />
        </div>
      )}
    </div>
  );
}
