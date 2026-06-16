import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { scoreGoalQuality } from '../../services/goalAI';
import { Button } from '../../components/primitives/Button';
import type { Goal } from '../../lib/schema';
import type { GoalQualityResult } from '../../services/goalAI';

interface Props {
  goal: Goal;
}

/** 维度名称映射 */
const DIMENSION_LABELS: Record<string, string> = {
  specificityScore: '具体性',
  measurabilityScore: '可衡量性',
  timeBoundScore: '时间约束',
  currentStateScore: '现状描述',
  successCriteriaScore: '成功标准',
  constraintsScore: '约束条件',
  decomposabilityScore: '可拆解性',
  realismScore: '现实性',
  conflictScore: '冲突性',
  reviewValueScore: '复盘价值',
};

/** All quality dimension keys — single source of truth */
const QUALITY_DIMENSIONS = [
  'specificityScore', 'measurabilityScore', 'timeBoundScore',
  'currentStateScore', 'successCriteriaScore', 'constraintsScore',
  'decomposabilityScore', 'realismScore', 'conflictScore', 'reviewValueScore',
] as const;

/** 获取分数等级颜色 */
function getScoreColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return '#22c55e'; // green
  if (ratio >= 0.6) return '#eab308'; // yellow
  if (ratio >= 0.4) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function GoalQualityScoreCard({ goal }: Props) {
  const settings = useTimelineStore((s) => s.settings);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GoalQualityResult | null>(() => {
    // 初始化时从 goal.ai 中读取已有的评分结果
    if (goal.ai?.qualityScore != null && goal.ai?.qualityDetails) {
      const details = goal.ai.qualityDetails;
      return {
        totalScore: goal.ai.qualityScore,
        ...Object.fromEntries(QUALITY_DIMENSIONS.map(k => [k, (details as Record<string, number>)[k]])),
        strengths: goal.ai.qualityStrengths ?? [],
        weaknesses: goal.ai.qualityWeaknesses ?? [],
        suggestions: goal.ai.qualitySuggestions ?? [],
      } as GoalQualityResult;
    }
    return null;
  });

  const handleScore = async () => {
    setStreaming(true);
    setError(null);
    try {
      const aiResult = await scoreGoalQuality(goal, settings.llm);
      if (aiResult.success) {
        setResult(aiResult.data);
        // 保存评分结果到 goal.ai
        const dataRec = aiResult.data as unknown as Record<string, number>;
        const qualityDetails = Object.fromEntries(
          QUALITY_DIMENSIONS.map(k => [k, dataRec[k]]),
        );
        const updatedGoal: Goal = {
          ...goal,
          ai: {
            ...goal.ai,
            qualityScore: aiResult.data.totalScore,
            qualityDetails: qualityDetails as NonNullable<Goal['ai']>['qualityDetails'],
            qualityStrengths: aiResult.data.strengths,
            qualityWeaknesses: aiResult.data.weaknesses,
            qualitySuggestions: aiResult.data.suggestions,
          },
          updatedAt: new Date().toISOString(),
        };
        useTimelineStore.getState().upsertGoal(updatedGoal);
      } else {
        setError('解析失败：' + aiResult.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setStreaming(false);
    }
  };

  const dimensionKeys = QUALITY_DIMENSIONS as unknown as string[];

  return (
    <div className="goal-quality-score-card">
      <h3>目标质量评分</h3>

      {result && (
        <>
          {/* 总分 */}
          <div className="quality-total-score">
            <span
              className="quality-score-value"
              style={{ color: getScoreColor(result.totalScore, 100) }}
            >
              {result.totalScore}
            </span>
            <span className="quality-score-max">/ 100</span>
          </div>

          {/* 10 维度评分 */}
          <div className="quality-dimensions">
            {dimensionKeys.map((key) => (
              <div key={key} className="quality-dimension-row">
                <span className="quality-dimension-label">
                  {DIMENSION_LABELS[key]}
                </span>
                <div className="quality-dimension-bar-bg">
                  <div
                    className="quality-dimension-bar-fill"
                    style={{
                      width: `${(result[key as keyof GoalQualityResult] as number) * 10}%`,
                      backgroundColor: getScoreColor(
                        result[key as keyof GoalQualityResult] as number,
                        10,
                      ),
                    }}
                  />
                </div>
                <span className="quality-dimension-score">
                  {result[key as keyof GoalQualityResult]}/10
                </span>
              </div>
            ))}
          </div>

          {/* 优势 */}
          {result.strengths.length > 0 && (
            <div className="quality-section">
              <strong>优势：</strong>
              <ul>
                {result.strengths.map((s, i) => (
                  <li key={i} className="quality-strength">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 不足 */}
          {result.weaknesses.length > 0 && (
            <div className="quality-section">
              <strong>不足：</strong>
              <ul>
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="quality-weakness">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 建议 */}
          {result.suggestions.length > 0 && (
            <div className="quality-section">
              <strong>改进建议：</strong>
              <ul>
                {result.suggestions.map((s, i) => (
                  <li key={i} className="quality-suggestion">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!result && !streaming && (
        <p className="quality-empty">尚未评估目标质量，点击下方按钮进行评估。</p>
      )}

      <Button onClick={handleScore} disabled={streaming} variant="secondary">
        {streaming ? '评估中...' : result ? '重新评分' : 'AI 评估目标质量'}
      </Button>

      {error && <div className="quality-error">{error}</div>}
    </div>
  );
}
