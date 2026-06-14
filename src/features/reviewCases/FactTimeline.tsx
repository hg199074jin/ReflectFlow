import type { EvidenceRef } from '../../lib/schema';
import { groupEvidenceByDate } from './reviewCaseUtils';

interface FactTimelineProps {
  evidenceRefs: EvidenceRef[];
  missingFacts?: string[];
  keyFactIds?: Set<string>;
  onToggleKeyFact?: (ref: EvidenceRef) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: '#8B6F4E',
  study: '#5E7B6A',
  side: '#6B5E7B',
};

const CATEGORY_LABELS: Record<string, string> = {
  work: '工作',
  study: '学习',
  side: '副业',
};

export function FactTimeline({
  evidenceRefs,
  missingFacts = [],
  keyFactIds,
  onToggleKeyFact,
}: FactTimelineProps) {
  const groups = groupEvidenceByDate(evidenceRefs);

  if (groups.length === 0 && missingFacts.length === 0) {
    return (
      <div className="fact-timeline-empty">
        <p>暂无证据记录</p>
        <p className="hint">请在时间线中添加记录，或手动标记关键事实</p>
      </div>
    );
  }

  return (
    <div className="fact-timeline">
      {groups.map((group) => (
        <div key={group.date} className="fact-date-group">
          <div className="fact-date-header">{group.date}</div>
          <div className="fact-items">
            {group.refs.map((ref) => {
              const isKeyFact = keyFactIds?.has(ref.bulletId) ?? false;
              return (
                <div
                  key={ref.bulletId}
                  className={`fact-item ${isKeyFact ? 'key-fact' : ''}`}
                >
                  <span
                    className="fact-category"
                    style={{ color: CATEGORY_COLORS[ref.category] }}
                  >
                    {CATEGORY_LABELS[ref.category]}
                  </span>
                  <span className="fact-text">{ref.text}</span>
                  {onToggleKeyFact && (
                    <button
                      className="fact-toggle"
                      onClick={() => onToggleKeyFact(ref)}
                      title={isKeyFact ? '取消关键事实' : '标记为关键事实'}
                    >
                      {isKeyFact ? '★' : '☆'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {missingFacts.length > 0 && (
        <div className="missing-facts">
          <div className="missing-facts-header">缺失事实</div>
          <ul>
            {missingFacts.map((fact, index) => (
              <li key={index} className="missing-fact-item">
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
