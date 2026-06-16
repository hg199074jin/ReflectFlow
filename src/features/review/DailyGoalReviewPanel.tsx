import { useMemo, useState } from 'react';
import { useTimelineStore } from '../../store';
import { suggestDailyAdjustment } from '../../services/goalAI';
import { Button } from '../../components/primitives/Button';
import { DAILY_GOAL_STATUS_LABELS, GAP_REASON_LABELS } from '../../lib/schema';
import type { DailyGoalStatus, GapReason } from '../../lib/schema';

interface Props {
  date: string;
}

export function DailyGoalReviewPanel({ date }: Props) {
  const dailyGoalTargets = useTimelineStore(s => s.dailyGoalTargets);
  const updateDailyGoalTarget = useTimelineStore(s => s.updateDailyGoalTarget);
  const goals = useTimelineStore(s => s.goals);
  const settings = useTimelineStore(s => s.settings);
  const targets = useMemo(() => Object.values(dailyGoalTargets).filter(t => t.date === date), [dailyGoalTargets, date]);

  const [adjustmentLoading, setAdjustmentLoading] = useState<Record<string, boolean>>({});
  const [adjustmentResults, setAdjustmentResults] = useState<Record<string, { nextAdjustment: string; suggestedTomorrowTask?: string }>>({});

  const handleSuggestAdjustment = async (targetId: string) => {
    const t = dailyGoalTargets[targetId];
    if (!t) return;
    const goal = goals[t.goalId];
    if (!goal) return;

    setAdjustmentLoading(prev => ({ ...prev, [targetId]: true }));
    try {
      const result = await suggestDailyAdjustment(
        goal, t, t.actualProgress ?? '', settings.llm, undefined, t.gap, t.gapReasons,
      );
      if (result.success) {
        setAdjustmentResults(prev => ({ ...prev, [targetId]: result.data }));
      }
    } catch {
      // Network or AI service errors are non-critical; loading state is cleared in finally
    } finally {
      setAdjustmentLoading(prev => ({ ...prev, [targetId]: false }));
    }
  };

  if (targets.length === 0) {
    return <div className="text-sm text-gray-500">今日无目标牵引</div>;
  }

  return (
    <div className="space-y-4">
      <h3>今日目标牵引</h3>
      {targets.map(t => (
        <div key={t.id} className="border rounded p-3 space-y-2">
          <div className="text-sm text-gray-500">关联目标: {t.goalId}</div>
          <div><strong>今日计划:</strong> {t.plannedTask}</div>
          <div><strong>最低完成标准:</strong> {t.minimumStandard}</div>
          <div><strong>预期产出:</strong> {t.expectedOutput}</div>
          <div>
            <strong>复盘问题:</strong>
            <ol>{t.reviewQuestions.map((q, i) => <li key={i}>{q}</li>)}</ol>
          </div>
          <select
            value={t.status}
            onChange={(e) => updateDailyGoalTarget(t.id, { status: e.target.value as DailyGoalStatus })}
          >
            {Object.entries(DAILY_GOAL_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea
            placeholder="实际进度"
            defaultValue={t.actualProgress ?? ''}
            onBlur={(e) => updateDailyGoalTarget(t.id, { actualProgress: e.target.value })}
          />
          <textarea
            placeholder="差距"
            defaultValue={t.gap ?? ''}
            onBlur={(e) => updateDailyGoalTarget(t.id, { gap: e.target.value })}
          />
          <div>
            <strong>差距原因:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(GAP_REASON_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={(t.gapReasons ?? []).includes(value as GapReason)}
                    onChange={(e) => {
                      const current = t.gapReasons ?? [];
                      const reason = value as GapReason;
                      const next = e.target.checked
                        ? [...current, reason]
                        : current.filter(r => r !== reason);
                      updateDailyGoalTarget(t.id, { gapReasons: next });
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <textarea
            placeholder="明日调整"
            defaultValue={t.nextAdjustment ?? ''}
            onBlur={(e) => updateDailyGoalTarget(t.id, { nextAdjustment: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={adjustmentLoading[t.id]}
              onClick={() => handleSuggestAdjustment(t.id)}
            >
              AI 调整建议
            </Button>
          </div>
          {adjustmentResults[t.id] && (() => {
            const adj = adjustmentResults[t.id]!;
            return (
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '6px', fontSize: '14px' }}>
              <strong>AI 调整建议：</strong>
              <p style={{ margin: '4px 0' }}>{adj.nextAdjustment}</p>
              {adj.suggestedTomorrowTask && (
                <p style={{ margin: '4px 0' }}>
                  <strong>明日建议：</strong>{adj.suggestedTomorrowTask}
                </p>
              )}
            </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
