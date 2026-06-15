import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { decomposeGoal } from '../../services/goalAI';
import { createId } from '../../lib/ids';
import { Button } from '../../components/primitives/Button';
import type { Goal, GoalPlan } from '../../lib/schema';

interface Props {
  goal: Goal;
}

export function GoalPlanPanel({ goal }: Props) {
  const addGoalPlan = useTimelineStore((s) => s.addGoalPlan);
  const addDailyGoalTargets = useTimelineStore((s) => s.addDailyGoalTargets);
  const goalPlans = useTimelineStore((s) => s.goalPlans);
  const dailyGoalTargets = useTimelineStore((s) => s.dailyGoalTargets);
  const settings = useTimelineStore((s) => s.settings);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingPlans = useMemo(
    () => Object.values(goalPlans).filter((p) => p.goalId === goal.id),
    [goalPlans, goal.id],
  );

  const existingTargets = useMemo(
    () =>
      Object.values(dailyGoalTargets)
        .filter((t) => t.goalId === goal.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [dailyGoalTargets, goal.id],
  );

  const handleDecompose = async () => {
    setStreaming(true);
    setError(null);
    try {
      const result = await decomposeGoal(goal, settings.llm);
      if (result.success) {
        const now = new Date().toISOString();
        const plan: GoalPlan = {
          id: createId(),
          goalId: goal.id,
          summary: result.data.summary,
          milestones: result.data.milestones,
          dailyTargets: result.data.dailyTargets,
          generatedBy: 'ai',
          generatedAt: now,
          version: existingPlans.length + 1,
        };
        addGoalPlan(plan);
        addDailyGoalTargets(result.data.dailyTargets);
      } else {
        setError('解析失败：' + result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="goal-plan-panel">
      <h3>AI 拆解计划</h3>

      {existingPlans.length > 0 && (
        <div className="goal-plan-list">
          {existingPlans.map((plan) => (
            <div key={plan.id} className="goal-plan-item">
              <div className="goal-plan-summary">
                <strong>计划摘要：</strong>
                <p>{plan.summary}</p>
              </div>

              {plan.milestones.length > 0 && (
                <div className="goal-plan-milestones">
                  <strong>里程碑：</strong>
                  <ul>
                    {plan.milestones.map((m) => (
                      <li key={m.id}>
                        <span className="milestone-title">{m.title}</span>
                        <span className="milestone-dates">
                          {m.startDate} ~ {m.endDate}
                        </span>
                        {m.expectedOutput && (
                          <span className="milestone-output">→ {m.expectedOutput}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {existingTargets.length > 0 && (
        <div className="goal-plan-daily-targets">
          <strong>每日目标：</strong>
          <ul>
            {existingTargets.map((t) => (
              <li key={t.id}>
                <span className="target-date">{t.date}</span>
                <span className="target-task">{t.plannedTask}</span>
                <span className="target-standard">标准：{t.minimumStandard}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {existingPlans.length === 0 && !streaming && (
        <p className="goal-plan-empty">尚未生成计划，点击下方按钮让 AI 拆解为每日目标。</p>
      )}

      <Button onClick={handleDecompose} disabled={streaming} variant="secondary">
        {streaming ? '生成中...' : existingPlans.length > 0 ? '重新拆解计划' : 'AI 拆解为每日目标'}
      </Button>

      {error && <div className="goal-plan-error">{error}</div>}
    </div>
  );
}
