import { useState, useRef, useCallback } from 'react';
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
  const [streamedText, setStreamedText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleComplete = async () => {
    setStreaming(true);
    setError(null);
    setStreamedText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await completeGoalDefinition(goal, settings.llm, {
        signal: controller.signal,
        onChunk: (accumulated) => setStreamedText(accumulated),
      });
      if (result.success) {
        applyGoalDefinitionResult(goal.id, result.data);
      } else {
        setError('解析失败：' + result.error);
      }
    } catch (e) {
      if (controller.signal.aborted) {
        setError('已取消生成');
      } else {
        setError(e instanceof Error ? e.message : '未知错误');
      }
    } finally {
      setStreaming(false);
      setStreamedText('');
      abortRef.current = null;
    }
  };

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

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

      {streaming && (
        <div className="streaming-preview">
          <div className="streaming-progress">
            生成中... [已生成 {streamedText.length} 字]
          </div>
          <pre className="streaming-text">
            {streamedText}
            <span className="streaming-cursor">|</span>
          </pre>
        </div>
      )}

      <div className="goal-def-actions">
        <Button onClick={handleComplete} disabled={streaming} variant="secondary">
          {streaming ? '生成中...' : hasDefinition ? '重新生成目标定义' : 'AI 补全目标定义'}
        </Button>
        {streaming && (
          <Button onClick={handleCancel} variant="ghost" size="sm">
            取消
          </Button>
        )}
      </div>

      {error && <div className="goal-def-error">{error}</div>}
    </div>
  );
}
