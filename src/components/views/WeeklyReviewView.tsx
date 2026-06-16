import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../primitives/Button';
import { MarkdownEditor } from '../primitives/MarkdownEditor';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import { generateWeeklyGoalReview } from '../../services/goalAI';
import type { WeeklyReview, ReviewTag } from '../../lib/schema';
import { REVIEW_TAG_LABELS } from '../../lib/schema';
import { getWeekRange } from '../../lib/date';
import type { WeeklyGoalReviewResult } from '../../services/goalAI';

interface WeeklyReviewViewProps {
  weekStart: string;
}

const WEEKLY_SECTIONS: Array<{ key: keyof WeeklyReview; label: string; placeholder: string }> = [
  { key: 'target', label: '本周目标', placeholder: '本周的核心目标是什么？' },
  { key: 'completed', label: '完成了什么', placeholder: '本周完成了哪些事情？' },
  { key: 'notCompleted', label: '没完成什么', placeholder: '哪些事情没有完成？' },
  { key: 'unexpected', label: '意外收获', placeholder: '有什么意外的收获？' },
  { key: 'keyEvent', label: '关键事件', placeholder: '选择本周最重要的1-2件事' },
  { key: 'keyEventReview', label: '关键事件复盘', placeholder: '对关键事件进行深度复盘' },
  { key: 'pattern', label: '规律提炼', placeholder: '本周发现了什么规律或模式？' },
  { key: 'adjustment', label: '下周调整', placeholder: '基于本周复盘，下周要调整什么？' },
];

export function WeeklyReviewView({ weekStart }: WeeklyReviewViewProps) {
  const settings = useTimelineStore((s) => s.settings);
  const weeklyReviews = useTimelineStore((s) => s.weeklyReviews);
  const updateWeeklyReview = useTimelineStore((s) => s.updateWeeklyReview);
  const goals = useTimelineStore((s) => s.goals);
  const dailyGoalTargets = useTimelineStore((s) => s.dailyGoalTargets);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalReviewLoading, setGoalReviewLoading] = useState(false);
  const [goalReviewResult, setGoalReviewResult] = useState<WeeklyGoalReviewResult | null>(null);
  const [goalReviewError, setGoalReviewError] = useState<string | null>(null);

  const range = getWeekRange(weekStart);
  const review = weeklyReviews[weekStart] || { weekStart };

  const weekTargets = useMemo(() => {
    return Object.values(dailyGoalTargets).filter(
      (t) => t.date >= range.start && t.date <= range.end,
    );
  }, [dailyGoalTargets, range.start, range.end]);

  const handleUpdate = (key: keyof WeeklyReview, value: string) => {
    updateWeeklyReview(weekStart, { [key]: value });
  };

  const handleTagToggle = (tag: ReviewTag) => {
    const currentTags = review.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateWeeklyReview(weekStart, { tags: newTags });
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setError(null);
    try {
      const provider = createOpenAICompatibleProvider(settings.llm);
      const entries = useTimelineStore.getState().entries;
      const weekEntries = Object.values(entries).filter(
        (e) => e.date >= range.start && e.date <= range.end
      );
      const summary = await provider.generateWeekSummary(weekEntries, weekStart);
      updateWeeklyReview(weekStart, { summary });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateGoalReview = async () => {
    const activeGoals = Object.values(goals).filter((g) => g.status === 'active');
    if (activeGoals.length === 0) {
      setGoalReviewError('没有活跃目标，无法生成目标校准建议');
      return;
    }
    if (weekTargets.length === 0) {
      setGoalReviewError('本周没有每日目标数据，无法生成目标校准建议');
      return;
    }

    setGoalReviewLoading(true);
    setGoalReviewError(null);
    try {
      const result = await generateWeeklyGoalReview(
        range.start, range.end, activeGoals, weekTargets, settings.llm,
      );
      if (result.success) {
        setGoalReviewResult(result.data);
      } else {
        setGoalReviewError('解析失败：' + result.error);
      }
    } catch (err) {
      setGoalReviewError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGoalReviewLoading(false);
    }
  };

  return (
    <div className="weekly-review-view">
      <div className="weekly-review-header">
        <h3 className="weekly-review-title">周复盘</h3>
        <span className="weekly-review-range">
          {range.start} ~ {range.end}
        </span>
      </div>

      <div className="weekly-review-sections">
        {WEEKLY_SECTIONS.map((section) => (
          <div key={section.key} className="weekly-review-section">
            <label className="weekly-review-label">{section.label}</label>
            <MarkdownEditor
              value={(review[section.key] as string) || ''}
              onChange={(value) => handleUpdate(section.key, value)}
              placeholder={section.placeholder}
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="weekly-review-section">
        <label className="weekly-review-label">复盘标签</label>
        <div className="review-tags">
          {(Object.entries(REVIEW_TAG_LABELS) as [ReviewTag, string][]).map(([tag, label]) => (
            <button
              key={tag}
              className={`review-tag ${review.tags?.includes(tag) ? 'active' : ''}`}
              onClick={() => handleTagToggle(tag)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="weekly-review-error">{error}</p>}

      <div className="weekly-review-actions">
        <Button
          variant="secondary"
          onClick={handleGenerateSummary}
          loading={generating}
        >
          AI生成周总结
        </Button>
      </div>

      {review.summary && (
        <div className="weekly-review-summary">
          <h4>AI周总结</h4>
          <div className="weekly-review-summary-content">
            {review.summary}
          </div>
        </div>
      )}

      <div className="weekly-review-section" style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        <label className="weekly-review-label">目标校准</label>
        <div className="weekly-review-actions">
          <Button
            variant="secondary"
            onClick={handleGenerateGoalReview}
            loading={goalReviewLoading}
          >
            {goalReviewResult ? '重新生成目标校准建议' : 'AI 生成目标校准建议'}
          </Button>
        </div>

        {goalReviewError && <p className="weekly-review-error">{goalReviewError}</p>}

        {goalReviewResult && (
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
              <strong>完成情况总结：</strong>
              <p>{goalReviewResult.completionSummary}</p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                <span>已完成：{goalReviewResult.completedTargets} 项</span>
                <span>未完成：{goalReviewResult.missedTargets} 项</span>
                <span>已调整：{goalReviewResult.adjustedTargets} 项</span>
              </div>
            </div>

            {goalReviewResult.mainDeviations.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>主要偏差：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {goalReviewResult.mainDeviations.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {goalReviewResult.recurringBlockers.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>反复出现的障碍：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {goalReviewResult.recurringBlockers.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}

            {goalReviewResult.effectiveActions.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>有效行动：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {goalReviewResult.effectiveActions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {goalReviewResult.ineffectiveActions.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>无效行动：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {goalReviewResult.ineffectiveActions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {goalReviewResult.nextWeekSuggestions.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>下周建议：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {goalReviewResult.nextWeekSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {goalReviewResult.goalsToPrioritize.length > 0 && (
              <div style={{ marginBottom: '8px', color: '#16a34a' }}>
                <strong>建议优先推进：</strong>
                <span style={{ marginLeft: '4px' }}>{goalReviewResult.goalsToPrioritize.join('、')}</span>
              </div>
            )}

            {goalReviewResult.goalsToPause.length > 0 && (
              <div style={{ marginBottom: '8px', color: '#dc2626' }}>
                <strong>建议暂停/缩减：</strong>
                <span style={{ marginLeft: '4px' }}>{goalReviewResult.goalsToPause.join('、')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
