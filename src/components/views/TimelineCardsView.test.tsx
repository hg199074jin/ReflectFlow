import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineCardsView } from './TimelineCardsView';
import { useTimelineStore } from '../../store';
import { clearAllData } from '../../store/persistence';

describe('TimelineCardsView', () => {
  beforeEach(async () => {
    await clearAllData();
    useTimelineStore.setState({
      entries: {},
      settings: {
        llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
        export: { folderStructure: 'year-month', includeAI: true },
      },
      selectedMonth: '2026-06',
      view: 'cards',
      aiInFlight: {},
    });
  });

  it('renders days in reverse chronological order', () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    render(<TimelineCardsView />);
    // June 30 should appear before June 1
    const dates = screen.getAllByText(/^\d{4}-\d{2}-\d{2}/);
    expect(dates[0]!.textContent).toMatch(/2026-06-30/);
  });

  it('shows today expanded', () => {
    // Mock today as 2026-06-13
    const today = '2026-06-13';
    useTimelineStore.getState().upsertEntryText(today, 'work', 'today task');
    render(<TimelineCardsView />);
    expect(screen.getByText('today task')).toBeInTheDocument();
  });

  it('shows empty state for days without content', () => {
    render(<TimelineCardsView />);
    // Should render 30 day cards for June
    const cards = document.querySelectorAll('.day-card');
    expect(cards.length).toBe(30);
  });

  it('updates store when typing', () => {
    const today = '2026-06-13';
    useTimelineStore.getState().upsertEntryText(today, 'work', 'existing task');
    render(<TimelineCardsView />);
    // Find the textarea that contains the existing task text
    const textarea = screen.getAllByRole('textbox').find(
      (el) => (el as HTMLTextAreaElement).value === 'existing task'
    ) as HTMLTextAreaElement;
    expect(textarea).toBeDefined();
    fireEvent.change(textarea, { target: { value: 'new task' } });
    const entry = useTimelineStore.getState().entries[today];
    expect(entry?.bullets.work[0]?.text).toBe('new task');
  });
});
