import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../../components/primitives/Button';
import { GoalEditor } from './GoalEditor';
import { GoalProgressPanel } from './GoalProgressPanel';
import { getGoalStatusLabel, getGoalStatusColor, getGoalPeriodLabel } from './goalUtils';
import type { Goal, GoalPeriod } from '../../lib/schema';

export function GoalsView() {
  const goals = useTimelineStore((s) => s.goals);
  const [showEditor, setShowEditor] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [filterPeriod, setFilterPeriod] = useState<GoalPeriod | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const filteredGoals = useMemo(() => {
    let result = Object.values(goals);
    if (filterPeriod !== 'all') {
      result = result.filter((g) => g.period === filterPeriod);
    }
    if (filterStatus !== 'all') {
      result = result.filter((g) => g.status === filterStatus);
    }
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [goals, filterPeriod, filterStatus]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowEditor(true);
  };

  const handleClose = () => {
    setShowEditor(false);
    setEditingGoal(undefined);
  };

  return (
    <div className="goals-view">
      <div className="goals-header">
        <h2 className="goals-title">Goals</h2>
        <Button onClick={() => setShowEditor(true)}>+ New Goal</Button>
      </div>

      <div className="goals-filters">
        <button
          className={`goals-filter-btn ${filterPeriod === 'all' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('all')}
        >
          All
        </button>
        <button
          className={`goals-filter-btn ${filterPeriod === 'week' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('week')}
        >
          Week
        </button>
        <button
          className={`goals-filter-btn ${filterPeriod === 'month' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('month')}
        >
          Month
        </button>
        <span className="goals-filter-divider" />
        <button
          className={`goals-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Status
        </button>
        <button
          className={`goals-filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </button>
        <button
          className={`goals-filter-btn ${filterStatus === 'done' ? 'active' : ''}`}
          onClick={() => setFilterStatus('done')}
        >
          Done
        </button>
      </div>

      <div className="goals-list">
        {filteredGoals.length === 0 ? (
          <p className="goals-empty">No goals yet. Create your first goal!</p>
        ) : (
          filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={() => handleEdit(goal)} />
          ))
        )}
      </div>

      {showEditor && (
        <GoalEditor goal={editingGoal} onClose={handleClose} />
      )}
    </div>
  );
}

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="goal-card">
      <div className="goal-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="goal-card-info">
          <span className="goal-card-title">{goal.title}</span>
          <span className="goal-card-period">{getGoalPeriodLabel(goal.period)}</span>
          <span
            className="goal-card-status"
            style={{ color: getGoalStatusColor(goal.status) }}
          >
            {getGoalStatusLabel(goal.status)}
          </span>
        </div>
        <div className="goal-card-meta">
          <span className="goal-card-dates">
            {goal.startDate} ~ {goal.endDate}
          </span>
          <span className="goal-card-bullets">
            {goal.linkedBullets.length} bullets
          </span>
          <button className="goal-card-edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            Edit
          </button>
        </div>
      </div>
      {expanded && (
        <div className="goal-card-body">
          <GoalProgressPanel goal={goal} />
        </div>
      )}
    </div>
  );
}
