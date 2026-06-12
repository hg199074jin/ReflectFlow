import { useTimelineStore } from '../../store';
import { calculateStreak, toDateKey } from '../../lib/date';

export function StreakBadge() {
  const entries = useTimelineStore((s) => s.entries);
  const entriesList = Object.values(entries);
  const today = toDateKey(new Date());
  const streak = calculateStreak(entriesList, today);

  if (streak === 0) return null;

  return (
    <span className="streak-badge">
      🔥 {streak} day{streak !== 1 ? 's' : ''}
    </span>
  );
}
