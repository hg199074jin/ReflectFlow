import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { StatsPanel } from './StatsPanel';
import { useTimelineStore } from '../../store';
import { clearAllData } from '../../store/persistence';

describe('StatsPanel', () => {
  beforeEach(async () => {
    await clearAllData();
    useTimelineStore.setState({
      entries: {},
      settings: {
        llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
        export: { folderStructure: 'year-month', includeAI: true },
      },
      selectedMonth: '2026-06',
      view: 'stats',
      aiInFlight: {},
    });
  });

  it('renders heatmap calendar', () => {
    render(<StatsPanel />);
    const cells = document.querySelectorAll('.heatmap-day');
    expect(cells.length).toBe(30); // June has 30 days
  });

  it('shows monthly totals', () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task a\ntask b');
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'study', 'study task');
    render(<StatsPanel />);
    // Check that the total bullets count is displayed
    const totalElements = screen.getAllByText('3');
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('shows streak count', () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    render(<StatsPanel />);
    expect(screen.getByText(/连续打卡/)).toBeInTheDocument();
  });

  it('renders classify projects button', () => {
    render(<StatsPanel />);
    expect(screen.getAllByText(/AI 分类项目/).length).toBeGreaterThan(0);
  });
});
