import { useTimelineStore } from '../../store';
import { getMonthDays } from '../../lib/date';
import { DayCard } from '../cards/DayCard';

export function TimelineCardsView() {
  const selectedMonth = useTimelineStore((s) => s.selectedMonth);
  const days = getMonthDays(selectedMonth);

  // Reverse chronological order
  const reversedDays = [...days].reverse();

  return (
    <div className="timeline-cards-view">
      {reversedDays.map((date) => (
        <DayCard key={date} date={date} />
      ))}
    </div>
  );
}
