import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { EntryEditor } from './EntryEditor';
import { AISection } from './AISection';
import { toDateKey } from '../../lib/date';

interface DayCardProps {
  date: string;
}

export function DayCard({ date }: DayCardProps) {
  const entry = useTimelineStore((s) => s.entries[date]);
  const today = toDateKey(new Date());
  const hasContent = entry && (
    entry.bullets.work.length > 0 ||
    entry.bullets.study.length > 0 ||
    entry.bullets.side.length > 0
  );
  const [expanded, setExpanded] = useState(date === today || hasContent);

  const bulletCount = entry
    ? entry.bullets.work.length + entry.bullets.study.length + entry.bullets.side.length
    : 0;

  const summary = entry?.ai?.reflection?.slice(0, 80) ?? (bulletCount > 0 ? `${bulletCount} bullet${bulletCount !== 1 ? 's' : ''}` : 'Empty');

  return (
    <div className="day-card">
      <div className="day-card-header" onClick={() => setExpanded(!expanded)}>
        <span className="day-card-date">{date}</span>
        <span className="day-card-summary">{summary}</span>
        <span className={`day-card-toggle ${expanded ? 'expanded' : ''}`}>▼</span>
      </div>
      {expanded && (
        <div className="day-card-body">
          <EntryEditor date={date} />
          <AISection date={date} />
        </div>
      )}
    </div>
  );
}
