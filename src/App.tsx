import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { MonthNav } from './components/nav/MonthNav';
import { TimelineCardsView } from './components/views/TimelineCardsView';
import { TimelineGanttView } from './components/views/TimelineGanttView';
import { StatsPanel } from './components/views/StatsPanel';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { Button } from './components/primitives/Button';

export default function App() {
  const { initialize, view } = useTimelineStore();
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

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
        <div className="app-header-actions">
          <Button variant="secondary" onClick={() => setShowSettings(true)}>Settings</Button>
          <Button variant="secondary" onClick={() => setShowExport(true)}>Export</Button>
        </div>
      </header>
      <MonthNav />
      <div className="view-container">
        {view === 'cards' && <TimelineCardsView />}
        {view === 'gantt' && <TimelineGanttView />}
        {view === 'stats' && <StatsPanel />}
      </div>
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </main>
  );
}
