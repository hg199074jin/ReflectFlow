import { useState, useMemo, useCallback } from 'react';
import { useTimelineStore } from '../../store';
import { detectGoalConflicts } from '../../services/goalAI';
import { saveGoalConflict } from '../../store/persistence';
import { Button } from '../../components/primitives/Button';
import { useAIStreaming } from '../../hooks/useAIStreaming';
import { createId } from '../../lib/ids';
import type { GoalConflict } from '../../lib/schema';

/** 冲突类型中文映射 */
const CONFLICT_TYPE_LABELS: Record<string, string> = {
  time_conflict: '时间冲突',
  energy_conflict: '精力冲突',
  priority_conflict: '优先级冲突',
  resource_conflict: '资源冲突',
  direction_conflict: '方向冲突',
  identity_conflict: '身份冲突',
  short_long_term_conflict: '短长期冲突',
};

/** 严重程度颜色 */
const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

/** 严重程度中文 */
const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export function GoalConflictPanel() {
  const goals = useTimelineStore((s) => s.goals);
  const settings = useTimelineStore((s) => s.settings);
  const [conflicts, setConflicts] = useState<GoalConflict[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activeGoals = useMemo(
    () => Object.values(goals).filter((g) => g.status === 'active'),
    [goals],
  );

  const handleSuccess = useCallback((data: import('../../services/goalAI').ConflictDetectionResult) => {
    const now = new Date().toISOString();
    const newConflicts: GoalConflict[] = data.conflicts.map((c) => ({
      id: createId(),
      goalIds: c.goalIds,
      type: c.type,
      severity: c.severity,
      description: c.description,
      evidence: c.evidence,
      suggestion: c.suggestion,
      createdAt: now,
    }));
    setConflicts(newConflicts);
    for (const c of newConflicts) {
      saveGoalConflict(c);
    }
  }, []);

  const { streaming, error, execute } = useAIStreaming({
    run: (signal) => detectGoalConflicts(activeGoals, settings.llm, { signal }),
    onSuccess: handleSuccess,
  });

  const handleDetect = () => {
    if (activeGoals.length < 2) {
      return;
    }
    execute();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getGoalTitle = (goalId: string) => {
    return goals[goalId]?.title ?? goalId;
  };

  return (
    <div className="goal-conflict-panel">
      <div className="goal-conflict-header">
        <h3>目标冲突检测</h3>
        <span className="goal-conflict-count">
          {activeGoals.length} 个活跃目标
        </span>
      </div>

      {conflicts.length > 0 && (
        <div className="goal-conflict-list">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`goal-conflict-item severity-${conflict.severity}`}
            >
              <div
                className="goal-conflict-item-header"
                onClick={() => toggleExpand(conflict.id)}
              >
                <div className="goal-conflict-meta">
                  <span
                    className="goal-conflict-severity"
                    style={{ color: SEVERITY_COLORS[conflict.severity] }}
                  >
                    [{SEVERITY_LABELS[conflict.severity]}]
                  </span>
                  <span className="goal-conflict-type">
                    {CONFLICT_TYPE_LABELS[conflict.type] ?? conflict.type}
                  </span>
                  <span className="goal-conflict-goals">
                    {conflict.goalIds.map((id) => getGoalTitle(id)).join(' vs ')}
                  </span>
                </div>
                <span className="goal-conflict-expand">
                  {expandedIds.has(conflict.id) ? '▼' : '▶'}
                </span>
              </div>

              <div className="goal-conflict-desc">{conflict.description}</div>

              {expandedIds.has(conflict.id) && (
                <div className="goal-conflict-details">
                  {conflict.evidence.length > 0 && (
                    <div className="goal-conflict-section">
                      <strong>证据：</strong>
                      <ul>
                        {conflict.evidence.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="goal-conflict-section">
                    <strong>建议：</strong>
                    <p>{conflict.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {conflicts.length === 0 && !streaming && (
        <p className="goal-conflict-empty">
          {activeGoals.length < 2
            ? '需要至少 2 个活跃目标才能检测冲突。'
            : '尚未检测冲突，点击下方按钮进行检测。'}
        </p>
      )}

      <Button
        onClick={handleDetect}
        disabled={streaming || activeGoals.length < 2}
        variant="secondary"
      >
        {streaming ? '检测中...' : conflicts.length > 0 ? '重新检测冲突' : 'AI 检测目标冲突'}
      </Button>

      {error && <div className="goal-conflict-error">{error}</div>}
    </div>
  );
}
