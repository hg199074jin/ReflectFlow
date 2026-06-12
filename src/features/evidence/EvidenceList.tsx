import type { EvidenceRef } from '../../lib/schema';

interface EvidenceListProps {
  evidence: EvidenceRef[];
  emptyMessage?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  work: '工作',
  study: '学习',
  side: '副业',
};

export function EvidenceList({ evidence, emptyMessage = '暂无证据' }: EvidenceListProps) {
  if (evidence.length === 0) {
    return <p className="evidence-empty">{emptyMessage}</p>;
  }

  return (
    <div className="evidence-list">
      {evidence.map((ref, i) => (
        <div key={`${ref.entryId}-${ref.bulletId}-${i}`} className="evidence-item">
          <span className="evidence-date">{ref.date}</span>
          <span className="evidence-category">{CATEGORY_LABELS[ref.category] || ref.category}</span>
          <span className="evidence-text">{ref.text}</span>
        </div>
      ))}
    </div>
  );
}
