import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { EntryEditor } from './EntryEditor';
import { AISection } from './AISection';
import { ConfirmDialog } from '../primitives/ConfirmDialog';
import { toDateKey } from '../../lib/date';

interface DayCardProps {
  date: string;
}

export function DayCard({ date }: DayCardProps) {
  const entry = useTimelineStore((s) => s.entries[date]);
  const deleteEntry = useTimelineStore((s) => s.deleteEntry);
  const today = toDateKey(new Date());
  const hasContent = entry && (
    entry.bullets.work.length > 0 ||
    entry.bullets.study.length > 0 ||
    entry.bullets.side.length > 0
  );
  const [expanded, setExpanded] = useState(date === today || hasContent);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const bulletCount = entry
    ? entry.bullets.work.length + entry.bullets.study.length + entry.bullets.side.length
    : 0;

  const summary = entry?.ai?.reflection?.slice(0, 80) ?? (bulletCount > 0 ? `${bulletCount} 条记录` : '空');

  const handleDelete = async () => {
    await deleteEntry(date);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="day-card">
        <div className="day-card-header" onClick={() => setExpanded(!expanded)}>
          <span className="day-card-date">{date}</span>
          <span className="day-card-summary">{summary}</span>
          <div className="day-card-actions">
            {hasContent && (
              <button
                className="day-card-delete-btn"
                title="删除此日记录"
                aria-label={`删除 ${date} 的记录`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                ✕
              </button>
            )}
            <span className={`day-card-toggle ${expanded ? 'expanded' : ''}`}>▼</span>
          </div>
        </div>
        {expanded && (
          <div className="day-card-body">
            <EntryEditor date={date} />
            <AISection date={date} />
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="删除记录"
          message={`确定要删除 ${date} 的所有记录吗？此操作不可撤销。`}
          confirmLabel="删除"
          cancelLabel="取消"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
