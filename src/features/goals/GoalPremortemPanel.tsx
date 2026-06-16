import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { generatePremortem } from '../../services/goalAI';
import { createId } from '../../lib/ids';
import { saveGoalPremortem } from '../../store/persistence';
import { Button } from '../../components/primitives/Button';
import type { Goal, GoalPremortem } from '../../lib/schema';
import type { PremortemResult } from '../../services/goalAI';

interface Props {
  goal: Goal;
}

export function GoalPremortemPanel({ goal }: Props) {
  const settings = useTimelineStore((s) => s.settings);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PremortemResult | null>(null);

  const handleGenerate = async () => {
    setStreaming(true);
    setError(null);
    try {
      const aiResult = await generatePremortem(goal, settings.llm);
      if (aiResult.success) {
        setResult(aiResult.data);
        // Persist the premortem
        const premortem: GoalPremortem = {
          id: createId(),
          goalId: goal.id,
          predictedFailureReasons: aiResult.data.predictedFailureReasons,
          underestimatedConstraints: aiResult.data.underestimatedConstraints,
          likelyDelays: aiResult.data.likelyDelays,
          triggerConditions: aiResult.data.triggerConditions,
          minimumViablePath: aiResult.data.minimumViablePath,
          createdAt: new Date().toISOString(),
        };
        saveGoalPremortem(premortem);
      } else {
        setError('解析失败：' + aiResult.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="goal-premortem-panel">
      <h3>事前推演</h3>

      {result && (
        <>
          {/* 预测失败原因 */}
          {result.predictedFailureReasons.length > 0 && (
            <div className="premortem-section">
              <strong>可能失败的原因：</strong>
              <ul>
                {result.predictedFailureReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 低估的约束 */}
          {result.underestimatedConstraints.length > 0 && (
            <div className="premortem-section">
              <strong>低估的约束：</strong>
              <ul>
                {result.underestimatedConstraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 可能的延迟 */}
          {result.likelyDelays.length > 0 && (
            <div className="premortem-section">
              <strong>可能的延迟：</strong>
              <ul>
                {result.likelyDelays.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 触发条件 */}
          {result.triggerConditions.length > 0 && (
            <div className="premortem-section">
              <strong>触发条件：</strong>
              <ul>
                {result.triggerConditions.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 最小可行路径 */}
          <div className="premortem-section">
            <strong>最小可行路径：</strong>
            <p>{result.minimumViablePath}</p>
          </div>
        </>
      )}

      {!result && !streaming && (
        <p className="premortem-empty">尚未进行事前推演，点击下方按钮让 AI 分析可能的风险。</p>
      )}

      <Button onClick={handleGenerate} disabled={streaming} variant="secondary">
        {streaming ? '分析中...' : result ? '重新推演' : 'AI 事前推演'}
      </Button>

      {error && <div className="premortem-error">{error}</div>}
    </div>
  );
}
