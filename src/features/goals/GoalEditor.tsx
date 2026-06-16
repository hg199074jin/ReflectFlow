import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { Select } from '../../components/primitives/Select';
import { MarkdownEditor } from '../../components/primitives/MarkdownEditor';
import { createEmptyGoal } from './goalUtils';
import { GoalDefinitionPanel } from './GoalDefinitionPanel';
import { GoalPlanPanel } from './GoalPlanPanel';
import { GoalQualityScoreCard } from './GoalQualityScoreCard';
import { GoalFinalReportView } from './GoalFinalReportView';
import { GoalPremortemPanel } from './GoalPremortemPanel';
import { RiskWarningBanner } from './RiskWarningBanner';
import { ProjectArchiveExport } from './ProjectArchiveExport';
import type { Goal, GoalPeriod, GoalStatus } from '../../lib/schema';

interface GoalEditorProps {
  goal?: Goal;
  onClose: () => void;
}

export function GoalEditor({ goal, onClose }: GoalEditorProps) {
  const { upsertGoal, deleteGoal } = useTimelineStore();

  const [title, setTitle] = useState(goal?.title || '');
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period || 'week');
  const [startDate, setStartDate] = useState(goal?.startDate || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(goal?.endDate || '');
  const [status, setStatus] = useState<GoalStatus>(goal?.status || 'active');
  const [notes, setNotes] = useState(goal?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Required';
    if (!startDate) newErrors.startDate = 'Required';
    if (!endDate) newErrors.endDate = 'Required';
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const goalData: Goal = goal
      ? { ...goal, title, period, startDate, endDate, status, notes, updatedAt: new Date().toISOString() }
      : createEmptyGoal({ title, period, startDate, endDate, notes });

    if (goal) {
      goalData.status = status;
    }

    await upsertGoal(goalData);
    onClose();
  };

  const handleDelete = async () => {
    if (goal) {
      await deleteGoal(goal.id);
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label={goal ? 'Edit Goal' : 'Create Goal'} onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">{goal ? 'Edit Goal' : 'Create Goal'}</h2>
        <div className="settings-form">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="What do you want to achieve?"
          />
          <Select
            label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </Select>
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={errors.endDate}
          />
          {goal && (
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
            >
              <option value="active">Active</option>
              <option value="done">Done</option>
              <option value="paused">Paused</option>
              <option value="dropped">Dropped</option>
            </Select>
          )}
          <div>
            <label className="input-label">Notes</label>
            <MarkdownEditor
              value={notes}
              onChange={setNotes}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>
        {goal && (
          <div className="goal-ai-panels">
            <GoalPremortemPanel goal={goal} />
            <RiskWarningBanner goal={goal} />
            <GoalDefinitionPanel goal={goal} />
            <GoalPlanPanel goal={goal} />
            <GoalQualityScoreCard goal={goal} />
            {(goal.status === 'done' || goal.status === 'dropped' || goal.status === 'paused') && (
              <GoalFinalReportView goal={goal} />
            )}
          </div>
        )}
        {goal && (
          <div className="dialog-actions" style={{ justifyContent: 'flex-start' }}>
            <ProjectArchiveExport goal={goal} />
          </div>
        )}
        <div className="dialog-actions">
          {goal && (
            <Button variant="ghost" onClick={handleDelete}>Delete</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
