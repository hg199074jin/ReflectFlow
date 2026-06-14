import type { Principle } from '../../lib/schema';
import { VERIFICATION_STATUS_LABELS } from '../../lib/schema';

interface PrincipleCardProps {
  principle: Principle;
  onStatusChange?: (newStatus: Principle['verificationStatus']) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const STATUS_COLORS: Record<Principle['verificationStatus'], string> = {
  unverified: '#9C8E7D',
  testing: '#C4956A',
  validated: '#5E7B6A',
  invalidated: '#C47A6A',
};

export function PrincipleCard({
  principle,
  onStatusChange,
  onEdit,
  onDelete,
}: PrincipleCardProps) {
  const statusColor = STATUS_COLORS[principle.verificationStatus];

  return (
    <div className="principle-card">
      <div className="principle-card-header">
        <h3 className="principle-title">{principle.title}</h3>
        <span
          className="principle-status"
          style={{ color: statusColor, borderColor: statusColor }}
        >
          {VERIFICATION_STATUS_LABELS[principle.verificationStatus]}
        </span>
      </div>

      <p className="principle-content">{principle.content}</p>

      {principle.applicableContexts.length > 0 && (
        <div className="principle-contexts">
          <span className="principle-contexts-label">适用场景：</span>
          {principle.applicableContexts.map((context, index) => (
            <span key={index} className="principle-context-tag">
              {context}
            </span>
          ))}
        </div>
      )}

      {principle.boundaries.length > 0 && (
        <div className="principle-boundaries">
          <span className="principle-boundaries-label">边界条件：</span>
          <ul>
            {principle.boundaries.map((boundary, index) => (
              <li key={index}>{boundary}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="principle-meta">
        <span>创建于 {principle.createdAt.slice(0, 10)}</span>
        {principle.evidenceRefs.length > 0 && (
          <span>{principle.evidenceRefs.length} 条证据</span>
        )}
      </div>

      {onStatusChange && (
        <div className="principle-status-actions">
          <select
            value={principle.verificationStatus}
            onChange={(e) => onStatusChange(e.target.value as Principle['verificationStatus'])}
          >
            {Object.entries(VERIFICATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="principle-actions">
        {onEdit && (
          <button className="btn-edit" onClick={onEdit}>
            编辑
          </button>
        )}
        {onDelete && (
          <button className="btn-delete" onClick={onDelete}>
            删除
          </button>
        )}
      </div>
    </div>
  );
}
