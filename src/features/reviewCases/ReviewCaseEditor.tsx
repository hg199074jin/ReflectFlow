import { useState } from 'react';
import { useTimelineStore } from '../../store';
import type { ReviewCase, ReviewCaseStatus } from '../../lib/schema';
import { REVIEW_CASE_STATUS_LABELS } from '../../lib/schema';
import { ReviewStepWizard } from './ReviewStepWizard';

interface ReviewCaseEditorProps {
  reviewCase: ReviewCase;
  onBack: () => void;
}

export function ReviewCaseEditor({ reviewCase, onBack }: ReviewCaseEditorProps) {
  const { upsertReviewCase } = useTimelineStore();
  const [title, setTitle] = useState(reviewCase.title);
  const [status, setStatus] = useState<ReviewCaseStatus>(reviewCase.status);

  const handleSaveTitle = () => {
    if (title.trim() && title !== reviewCase.title) {
      upsertReviewCase({
        ...reviewCase,
        title: title.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleStatusChange = (newStatus: ReviewCaseStatus) => {
    setStatus(newStatus);
    upsertReviewCase({
      ...reviewCase,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="review-case-editor">
      <div className="review-case-editor-header">
        <button className="btn-back" onClick={onBack}>
          ← 返回
        </button>
        <div className="review-case-title-section">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            className="review-case-title-input"
          />
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ReviewCaseStatus)}
            className="review-case-status-select"
          >
            {Object.entries(REVIEW_CASE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="review-case-meta">
          <span>{reviewCase.type}</span>
          <span>{reviewCase.startDate} ~ {reviewCase.endDate}</span>
        </div>
      </div>

      <ReviewStepWizard reviewCase={reviewCase} />
    </div>
  );
}
