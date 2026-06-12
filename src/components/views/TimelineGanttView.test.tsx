import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineGanttView } from './TimelineGanttView';
import { useTimelineStore } from '../../store';
import { clearAllData } from '../../store/persistence';

describe('TimelineGanttView', () => {
  beforeEach(async () => {
    await clearAllData();
    useTimelineStore.setState({
      entries: {},
      settings: {
        llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
        export: { folderStructure: 'year-month', includeAI: true },
      },
      selectedMonth: '2026-06',
      view: 'gantt',
      aiInFlight: {},
    });
  });

  it('renders empty state when no projects', () => {
    render(<TimelineGanttView />);
    expect(screen.getByText(/no projects/i)).toBeInTheDocument();
  });

  it('groups bullets by project', () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task a');
    const entry = useTimelineStore.getState().entries['2026-06-13']!;
    useTimelineStore.getState().setProjects([{
      name: 'Project X',
      bulletRefs: [{ entryId: entry.id, bulletId: entry.bullets.work[0]!.id }],
    }]);
    render(<TimelineGanttView />);
    expect(screen.getByText('Project X')).toBeInTheDocument();
  });

  it('renders classify projects button', () => {
    render(<TimelineGanttView />);
    expect(screen.getAllByText(/classify projects/i).length).toBeGreaterThan(0);
  });
});
