import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { MonthNav } from './components/nav/MonthNav';
import { TimelineCardsView } from './components/views/TimelineCardsView';
import { TimelineGanttView } from './components/views/TimelineGanttView';
import { StatsPanel } from './components/views/StatsPanel';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { Button } from './components/primitives/Button';

export default function App() {
  const { initialize, view } = useTimelineStore();
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
        <Button variant="secondary" onClick={() => setShowSettings(true)}>Settings</Button>
      </header>
      <MonthNav />
      <div className="view-container">
        {view === 'cards' && <TimelineCardsView />}
        {view === 'gantt' && <TimelineGanttView />}
        {view === 'stats' && <StatsPanel />}
      </div>
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </main>
  );
}
