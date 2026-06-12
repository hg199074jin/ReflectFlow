import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { MarkdownEditor } from '../primitives/MarkdownEditor';
import type { DailyReview, ReviewTag } from '../../lib/schema';
import { REVIEW_TAG_LABELS } from '../../lib/schema';

interface ReviewEditorProps {
  date: string;
}

const REVIEW_SECTIONS: Array<{ key: keyof DailyReview; label: string; placeholder: string }> = [
  { key: 'target', label: '今日目标', placeholder: '今天计划做什么？' },
  { key: 'gap', label: '差距分析', placeholder: '完成度如何？哪里有差距？' },
  { key: 'reason', label: '原因分析', placeholder: '为什么有差距？根因是什么？' },
  { key: 'whatIf', label: '推演思考', placeholder: '如果重来，你会怎么做？' },
  { key: 'lesson', label: '经验提炼', placeholder: '下次遇到类似情况怎么做？' },
];

export function ReviewEditor({ date }: ReviewEditorProps) {
  const entry = useTimelineStore((s) => s.entries[date]);
  const updateDailyReview = useTimelineStore((s) => s.updateDailyReview);
  const [expanded, setExpanded] = useState(false);

  const review = entry?.review;
  const hasReview = review && (
    review.target || review.gap || review.reason || review.whatIf || review.lesson
  );

  const handleUpdate = (key: keyof DailyReview, value: string) => {
    updateDailyReview(date, { [key]: value });
  };

  const handleTagToggle = (tag: ReviewTag) => {
    const currentTags = review?.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateDailyReview(date, { tags: newTags });
  };

  const handleQuality = (quality: number) => {
    updateDailyReview(date, { quality });
  };

  return (
    <div className="review-editor">
      <div
        className="review-editor-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="review-editor-title">
          {hasReview ? '📝 复盘' : '📝 开始复盘'}
        </span>
        <span className={`review-editor-toggle ${expanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {expanded && (
        <div className="review-editor-body">
          {REVIEW_SECTIONS.map((section) => (
            <div key={section.key} className="review-section">
              <label className="review-section-label">{section.label}</label>
              <MarkdownEditor
                value={(review?.[section.key] as string) || ''}
                onChange={(value) => handleUpdate(section.key, value)}
                placeholder={section.placeholder}
                rows={2}
              />
            </div>
          ))}

          <div className="review-section">
            <label className="review-section-label">复盘标签</label>
            <div className="review-tags">
              {(Object.entries(REVIEW_TAG_LABELS) as [ReviewTag, string][]).map(([tag, label]) => (
                <button
                  key={tag}
                  className={`review-tag ${review?.tags?.includes(tag) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="review-section">
            <label className="review-section-label">复盘质量</label>
            <div className="review-quality">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`review-star ${(review?.quality || 0) >= star ? 'active' : ''}`}
                  onClick={() => handleQuality(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
