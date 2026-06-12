import { useTimelineStore } from '../../store';
import { Button } from '../primitives/Button';
import { StreakBadge } from './StreakBadge';
import type { ViewMode } from '../../lib/schema';

export function MonthNav() {
  const { selectedMonth, setSelectedMonth, view, setView } = useTimelineStore();

  const handlePrev = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`);
  };

  const handleNext = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    setSelectedMonth(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`);
  };

  const views: { key: ViewMode; label: string }[] = [
    { key: 'cards', label: 'Cards' },
    { key: 'gantt', label: 'Gantt' },
    { key: 'stats', label: 'Stats' },
  ];

  return (
    <nav className="month-nav">
      <div className="month-nav-controls">
        <Button variant="ghost" onClick={handlePrev}>←</Button>
        <input
          type="month"
          className="month-nav-input"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <Button variant="ghost" onClick={handleNext}>→</Button>
      </div>
      <div className="view-toggle">
        {views.map((v) => (
          <button
            key={v.key}
            className={`view-toggle-btn ${view === v.key ? 'active' : ''}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <StreakBadge />
    </nav>
  );
}
