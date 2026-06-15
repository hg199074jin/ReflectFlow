import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { completeGoalDefinition } from '../../services/goalAI';
import { Button } from '../../components/primitives/Button';
import type { Goal } from '../../lib/schema';

interface Props {
  goal: Goal;
}

export function GoalDefinitionPanel({ goal }: Props) {
  const applyGoalDefinitionResult = useTimelineStore((s) => s.applyGoalDefinitionResult);
  const settings = useTimelineStore((s) => s.settings);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setStreaming(true);
    setError(null);
    try {
      const result = await completeGoalDefinition(goal, settings.llm);
      if (result.success) {
        applyGoalDefinitionResult(goal.id, result.data);
      } else {
        setError('解析失败：' + result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setStreaming(false);
    }
  };

  const hasDefinition =
    (goal.successCriteria && goal.successCriteria.length > 0) ||
    (goal.constraints && goal.constraints.length > 0) ||
    (goal.risks && goal.risks.length > 0) ||
    goal.acceptanceMethod;

  return (
    <div className="goal-definition-panel">
      <h3>目标定义</h3>

      {goal.successCriteria && goal.successCriteria.length > 0 && (
        <div className="goal-def-section">
          <strong>成功标准：</strong>
          <ul>
            {goal.successCriteria.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {goal.constraints && goal.constraints.length > 0 && (
        <div className="goal-def-section">
          <strong>约束条件：</strong>
          <ul>
            {goal.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {goal.risks && goal.risks.length > 0 && (
        <div className="goal-def-section">
          <strong>风险点：</strong>
          <ul>
            {goal.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {goal.acceptanceMethod && (
        <div className="goal-def-section">
          <strong>验收方式：</strong>
          <span>{goal.acceptanceMethod}</span>
        </div>
      )}

      {!hasDefinition && !streaming && (
        <p className="goal-def-empty">尚未定义目标细节，点击下方按钮让 AI 补全。</p>
      )}

      <Button onClick={handleComplete} disabled={streaming} variant="secondary">
        {streaming ? '生成中...' : hasDefinition ? '重新生成目标定义' : 'AI 补全目标定义'}
      </Button>

      {error && <div className="goal-def-error">{error}</div>}
    </div>
  );
}
