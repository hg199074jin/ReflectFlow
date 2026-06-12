import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { CheckinView } from './components/views/CheckinView';
import { TimelineView } from './components/views/TimelineView';
import { TimelineGanttView } from './components/views/TimelineGanttView';
import { StatsPanel } from './components/views/StatsPanel';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { Button } from './components/primitives/Button';
import type { AppMode } from './lib/schema';

export default function App() {
  const { initialize, view, setView, appMode, setAppMode } = useTimelineStore();
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, [initialize]);

  if (!ready) {
    return <main className="app-shell">Loading...</main>;
  }

  const modes: { key: AppMode; label: string; icon: string }[] = [
    { key: 'checkin', label: '录入', icon: '✏️' },
    { key: 'browse', label: '查看', icon: '📊' },
  ];

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Daily Check-in Timeline</h1>
        <div className="app-header-actions">
          <Button variant="secondary" onClick={() => setShowSettings(true)}>Settings</Button>
          <Button variant="secondary" onClick={() => setShowExport(true)}>Export</Button>
        </div>
      </header>

      <nav className="app-mode-nav">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`app-mode-btn ${appMode === mode.key ? 'active' : ''}`}
            onClick={() => setAppMode(mode.key)}
          >
            <span className="app-mode-icon">{mode.icon}</span>
            <span className="app-mode-label">{mode.label}</span>
          </button>
        ))}
      </nav>

      {appMode === 'checkin' ? (
        <CheckinView />
      ) : (
        <>
          <div className="browse-tabs">
            <button
              className={`browse-tab ${view === 'cards' ? 'active' : ''}`}
              onClick={() => setView('cards')}
            >
              Timeline
            </button>
            <button
              className={`browse-tab ${view === 'gantt' ? 'active' : ''}`}
              onClick={() => setView('gantt')}
            >
              Gantt
            </button>
            <button
              className={`browse-tab ${view === 'stats' ? 'active' : ''}`}
              onClick={() => setView('stats')}
            >
              Stats
            </button>
          </div>
          <div className="view-container">
            {view === 'cards' && <TimelineView />}
            {view === 'gantt' && <TimelineGanttView />}
            {view === 'stats' && <StatsPanel />}
          </div>
        </>
      )}

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </main>
  );
}
