import { useEffect, useState } from 'react';
import { useTimelineStore } from './store';
import { CheckinView } from './components/views/CheckinView';
import { TimelineView } from './components/views/TimelineView';
import { ExperienceTimelineView } from './components/views/ExperienceTimelineView';
import { TimelineGanttView } from './components/views/TimelineGanttView';
import { StatsPanel } from './components/views/StatsPanel';
import { ReviewHistory } from './components/views/ReviewHistory';
import { WeeklyReviewView } from './components/views/WeeklyReviewView';
import { MonthlyReviewReport } from './components/views/MonthlyReviewReport';
import { GoalsView } from './features/goals/GoalsView';
import { ReportsView } from './features/reports/ReportsView';
import { InsightsView } from './features/insights/InsightsView';
import { ReviewCasesView } from './features/reviewCases/ReviewCasesView';
import { PreviewPlansView } from './features/preview/PreviewPlansView';
import { PrinciplesView } from './features/principles/PrinciplesView';
import { DashboardView } from './features/dashboard/DashboardView';
import { WeeklyReviewDashboard } from './features/dashboard/WeeklyReviewDashboard';
import { CoachPanel } from './features/coach/CoachPanel';
import { SearchView } from './components/views/SearchView';
import { ExampleDataLoader } from './components/cards/ExampleDataLoader';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { Button } from './components/primitives/Button';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
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

  useKeyboardShortcuts({
    onOpenSettings: () => setShowSettings(true),
    onOpenExport: () => setShowExport(true),
    onCloseDialog: () => {
      setShowSettings(false);
      setShowExport(false);
    },
  });

  if (!ready) {
    return (
      <main className="app-shell">
        <div className="skeleton-header">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-actions">
            <div className="skeleton-line skeleton-btn" />
            <div className="skeleton-line skeleton-btn" />
          </div>
        </div>
        <div className="skeleton-mode-nav">
          <div className="skeleton-line skeleton-mode-btn" />
          <div className="skeleton-line skeleton-mode-btn" />
        </div>
        <div className="skeleton-cards">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line skeleton-card-date" />
              <div className="skeleton-line skeleton-card-text" />
              <div className="skeleton-line skeleton-card-text short" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  const modes: { key: AppMode; label: string; icon: string }[] = [
    { key: 'checkin', label: '录入', icon: 'Write' },
    { key: 'browse', label: '查看', icon: 'Review' },
  ];

  const today = toDateKey(new Date());
  const currentWeekStart = getWeekRange(today).start;

  const browseTabs: { key: ViewMode; label: string }[] = [
    { key: 'cards', label: '时间线' },
    { key: 'experience', label: '经历线' },
    { key: 'gantt', label: '甘特图' },
    { key: 'stats', label: '统计' },
    { key: 'review', label: '复盘' },
    { key: 'goals', label: '目标' },
    { key: 'dashboard', label: '总览' },
    { key: 'weekly-dashboard', label: '我的一周复盘' },
    { key: 'preview', label: '事前沙盘' },
    { key: 'reports', label: '报告' },
    { key: 'insights', label: '洞察' },
    { key: 'reviews', label: '复盘案例' },
    { key: 'principles', label: '原则库' },
    { key: 'coach', label: 'AI 教练' },
    { key: 'search', label: '搜索' },
  ];

  return (
    <main className={`app-shell app-shell-mode-${appMode}`}>
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">R</span>
          <div>
            <p className="app-brand-kicker">Reflection Flow</p>
            <h1>每日打卡时间线</h1>
            <p className="app-brand-subtitle">把每日行动沉淀成清晰、可复盘的长期成长水流。</p>
          </div>
        </div>
        <div className="app-header-actions">
          <Button variant="secondary" onClick={() => setShowSettings(true)}>设置</Button>
          <Button variant="secondary" onClick={() => setShowExport(true)}>导出</Button>
        </div>
      </header>

      <ExampleDataLoader />

      <nav className="app-mode-nav">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`app-mode-btn ${appMode === mode.key ? 'active' : ''}`}
            onClick={() => setAppMode(mode.key)}
          >
            <span className="app-mode-icon" aria-hidden="true">{mode.icon}</span>
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
            {view === 'experience' && <ExperienceTimelineView />}
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
            {view === 'dashboard' && <DashboardView />}
            {view === 'weekly-dashboard' && <WeeklyReviewDashboard />}
            {view === 'preview' && <PreviewPlansView />}
            {view === 'reports' && <ReportsView />}
            {view === 'insights' && <InsightsView />}
            {view === 'reviews' && <ReviewCasesView />}
            {view === 'principles' && <PrinciplesView />}
            {view === 'coach' && <CoachPanel />}
            {view === 'search' && <SearchView />}
          </div>
        </>
      )}

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </main>
  );
}
