import { useTimelineStore } from '../../store';
import { EntryEditor } from '../cards/EntryEditor';
import { AISection } from '../cards/AISection';
import { toDateKey, calculateStreak } from '../../lib/date';

export function CheckinView() {
  const today = toDateKey(new Date());
  const entries = useTimelineStore((s) => s.entries);
  const entry = entries[today];
  const entriesList = Object.values(entries);
  const streak = calculateStreak(entriesList, today);

  const bulletCount = entry
    ? entry.bullets.work.length + entry.bullets.study.length + entry.bullets.side.length
    : 0;

  return (
    <div className="checkin-view">
      <div className="checkin-header">
        <div className="checkin-date-section">
          <h2 className="checkin-date">{today}</h2>
          <span className="checkin-weekday">{getWeekday(today)}</span>
        </div>
        <div className="checkin-stats">
          {streak > 0 && (
            <span className="streak-badge">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
          )}
          {bulletCount > 0 && (
            <span className="checkin-bullet-count">{bulletCount} bullet{bulletCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="checkin-editor-section">
        <h3 className="checkin-section-title">Today's Activities</h3>
        <EntryEditor date={today} />
      </div>

      <div className="checkin-ai-section">
        <AISection date={today} />
      </div>
    </div>
  );
}

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()] ?? '';
}
