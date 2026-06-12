import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { Button } from './components/primitives/Button';

export default function App() {
  const { initialize, selectedMonth, view, setView, setSelectedMonth } = useTimelineStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, [initialize]);

  if (!ready) {
    return <main className="app-shell">Loading...</main>;
  }

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    setSelectedMonth(prev);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    setSelectedMonth(next);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Daily Check-in Timeline</h1>
        <div className="app-header-actions">
          <Button variant="secondary" onClick={() => {}}>Settings</Button>
          <Button variant="secondary" onClick={() => {}}>Export</Button>
        </div>
      </header>

      <nav className="month-nav">
        <div className="month-nav-controls">
          <Button variant="ghost" onClick={handlePrevMonth}>←</Button>
          <input
            type="month"
            className="month-nav-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <Button variant="ghost" onClick={handleNextMonth}>→</Button>
        </div>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${view === 'cards' ? 'active' : ''}`}
            onClick={() => setView('cards')}
          >
            Cards
          </button>
          <button
            className={`view-toggle-btn ${view === 'gantt' ? 'active' : ''}`}
            onClick={() => setView('gantt')}
          >
            Gantt
          </button>
          <button
            className={`view-toggle-btn ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}
          >
            Stats
          </button>
        </div>
      </nav>

      <div className="view-container">
        <p>View: {view} | Month: {selectedMonth}</p>
      </div>
    </main>
  );
}
