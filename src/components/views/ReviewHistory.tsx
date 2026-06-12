import { useMemo, useState } from 'react';
import { useTimelineStore } from '../../store';
import { REVIEW_TAG_LABELS } from '../../lib/schema';
import type { ReviewTag, Entry } from '../../lib/schema';

export function ReviewHistory() {
  const entries = useTimelineStore((s) => s.entries);
  const [selectedTag, setSelectedTag] = useState<ReviewTag | null>(null);

  const totalReviewCount = useMemo(() => {
    return Object.values(entries).filter((e) => e.review).length;
  }, [entries]);

  const reviewedEntries = useMemo(() => {
    let filtered = Object.values(entries).filter((e) => e.review && (
      e.review.target || e.review.gap || e.review.reason || e.review.lesson
    ));

    if (selectedTag) {
      filtered = filtered.filter((e) => e.review?.tags?.includes(selectedTag));
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, selectedTag]);

  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    for (const entry of Object.values(entries)) {
      if (entry.review?.tags) {
        for (const tag of entry.review.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag: tag as ReviewTag, count }));
  }, [entries]);

  return (
    <div className="review-history">
      <h3 className="review-history-title">复盘回顾</h3>

      <div className="review-history-filters">
        <button
          className={`review-filter-btn ${selectedTag === null ? 'active' : ''}`}
          onClick={() => setSelectedTag(null)}
        >
          全部 ({totalReviewCount})
        </button>
        {allTags.map(({ tag, count }) => (
          <button
            key={tag}
            className={`review-filter-btn ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => setSelectedTag(tag)}
          >
            {REVIEW_TAG_LABELS[tag]} ({count})
          </button>
        ))}
      </div>

      <div className="review-history-list">
        {reviewedEntries.length === 0 ? (
          <p className="review-history-empty">
            {selectedTag
              ? `没有"${REVIEW_TAG_LABELS[selectedTag]}"标签的复盘记录`
              : '还没有复盘记录，开始你的第一次复盘吧！'}
          </p>
        ) : (
          reviewedEntries.map((entry) => (
            <ReviewCard key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function ReviewCard({ entry }: { entry: Entry }) {
  const [expanded, setExpanded] = useState(false);
  const review = entry.review!;

  return (
    <div className="review-card">
      <div
        className="review-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="review-card-date">{entry.date}</span>
        <div className="review-card-tags">
          {review.tags?.map((tag) => (
            <span key={tag} className="review-card-tag">
              {REVIEW_TAG_LABELS[tag]}
            </span>
          ))}
        </div>
        {review.quality && (
          <span className="review-card-quality">
            {'★'.repeat(review.quality)}{'☆'.repeat(5 - review.quality)}
          </span>
        )}
        <span className={`review-card-toggle ${expanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {expanded && (
        <div className="review-card-body">
          {review.target && (
            <div className="review-card-section">
              <strong>今日目标：</strong>
              <p>{review.target}</p>
            </div>
          )}
          {review.gap && (
            <div className="review-card-section">
              <strong>差距分析：</strong>
              <p>{review.gap}</p>
            </div>
          )}
          {review.reason && (
            <div className="review-card-section">
              <strong>原因分析：</strong>
              <p>{review.reason}</p>
            </div>
          )}
          {review.whatIf && (
            <div className="review-card-section">
              <strong>推演思考：</strong>
              <p>{review.whatIf}</p>
            </div>
          )}
          {review.lesson && (
            <div className="review-card-section">
              <strong>经验提炼：</strong>
              <p>{review.lesson}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
