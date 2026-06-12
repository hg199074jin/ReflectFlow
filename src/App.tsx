import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { CheckinView } from './components/views/CheckinView';
import { TimelineView } from './components/views/TimelineView';
import { TimelineGanttView } from './components/views/TimelineGanttView';
import { StatsPanel } from './components/views/StatsPanel';
import { ReviewHistory } from './components/views/ReviewHistory';
import { WeeklyReviewView } from './components/views/WeeklyReviewView';
import { MonthlyReviewReport } from './components/views/MonthlyReviewReport';
import { GoalsView } from './features/goals/GoalsView';
import { ReportsView } from './features/reports/ReportsView';
import { InsightsView } from './features/insights/InsightsView';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { Button } from './components/primitives/Button';
import type { AppMode, ViewMode } from './lib/schema';
import { getWeekRange, toDateKey } from './lib/date';

export default function App() {
  const { initialize, view, setView, appMode, setAppMode, selectedMonth } = useTimelineStore();
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

  const today = toDateKey(new Date());
  const currentWeekStart = getWeekRange(today).start;

  const browseTabs: { key: ViewMode; label: string }[] = [
    { key: 'cards', label: 'Timeline' },
    { key: 'gantt', label: 'Gantt' },
    { key: 'stats', label: 'Stats' },
    { key: 'review', label: '复盘' },
    { key: 'goals', label: 'Goals' },
    { key: 'reports', label: 'Reports' },
    { key: 'insights', label: 'Insights' },
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
            {browseTabs.map((tab) => (
              <button
                key={tab.key}
                className={`browse-tab ${view === tab.key ? 'active' : ''}`}
                onClick={() => setView(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="view-container">
            {view === 'cards' && <TimelineView />}
            {view === 'gantt' && <TimelineGanttView />}
            {view === 'stats' && <StatsPanel />}
            {view === 'review' && (
              <div className="review-container">
                <div className="review-row">
                  <div className="review-col">
                    <WeeklyReviewView weekStart={currentWeekStart} />
                  </div>
                  <div className="review-col">
                    <MonthlyReviewReport month={selectedMonth} />
                  </div>
                </div>
                <ReviewHistory />
              </div>
            )}
            {view === 'goals' && <GoalsView />}
            {view === 'reports' && <ReportsView />}
            {view === 'insights' && <InsightsView />}
          </div>
        </>
      )}

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </main>
  );
}
