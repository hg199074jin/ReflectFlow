import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../primitives/Button';
import { MarkdownEditor } from '../primitives/MarkdownEditor';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import type { WeeklyReview, ReviewTag } from '../../lib/schema';
import { REVIEW_TAG_LABELS } from '../../lib/schema';
import { getWeekRange } from '../../lib/date';

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
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = getWeekRange(weekStart);
  const review = weeklyReviews[weekStart] || { weekStart };

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
    </div>
  );
}
