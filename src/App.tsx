import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { MonthNav } from './components/nav/MonthNav';
import { TimelineCardsView } from './components/views/TimelineCardsView';

export default function App() {
  const { initialize, view } = useTimelineStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, [initialize]);

  if (!ready) {
    return <main className="app-shell">Loading...</main>;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Daily Check-in Timeline</h1>
      </header>
      <MonthNav />
      <div className="view-container">
        {view === 'cards' && <TimelineCardsView />}
        {view === 'gantt' && <p>Gantt view coming soon</p>}
        {view === 'stats' && <p>Stats view coming soon</p>}
      </div>
    </main>
  );
}
