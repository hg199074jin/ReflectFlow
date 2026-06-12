import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore, getEntryByDate, getEntriesForMonth, getEntriesForWeek } from './index';
import { clearAllData } from './persistence';

describe('useTimelineStore', () => {
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

  describe('upsertEntryText', () => {
    it('creates a new entry', () => {
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task one\ntask two');
      const entry = getEntryByDate('2026-06-13');
      expect(entry).toBeTruthy();
      expect(entry!.bullets.work).toHaveLength(2);
      expect(entry!.bullets.work[0].text).toBe('task one');
    });

    it('updates existing entry', () => {
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'old');
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'new');
      const entry = getEntryByDate('2026-06-13');
      expect(entry!.bullets.work).toHaveLength(1);
      expect(entry!.bullets.work[0].text).toBe('new');
    });

    it('preserves other categories', () => {
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'work task');
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'study', 'study task');
      const entry = getEntryByDate('2026-06-13');
      expect(entry!.bullets.work).toHaveLength(1);
      expect(entry!.bullets.study).toHaveLength(1);
    });
  });

  describe('view and month', () => {
    it('sets view mode', () => {
      useTimelineStore.getState().setView('stats');
      expect(useTimelineStore.getState().view).toBe('stats');
    });

    it('sets selected month', () => {
      useTimelineStore.getState().setSelectedMonth('2026-07');
      expect(useTimelineStore.getState().selectedMonth).toBe('2026-07');
    });
  });

  describe('AI actions', () => {
    it('sets and clears aiInFlight', () => {
      useTimelineStore.getState().setAIInFlight('2026-06-13', true);
      expect(useTimelineStore.getState().aiInFlight['2026-06-13']).toBe(true);
      useTimelineStore.getState().setAIInFlight('2026-06-13', false);
      expect(useTimelineStore.getState().aiInFlight['2026-06-13']).toBeUndefined();
    });

    it('sets reflection', () => {
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
      useTimelineStore.getState().setReflection('2026-06-13', 'Good day');
      const entry = getEntryByDate('2026-06-13');
      expect(entry!.ai?.reflection).toBe('Good day');
    });

    it('sets week summary on all entries in week', () => {
      // Week of June 8-14, 2026
      useTimelineStore.getState().upsertEntryText('2026-06-09', 'work', 'monday');
      useTimelineStore.getState().upsertEntryText('2026-06-10', 'work', 'tuesday');
      useTimelineStore.getState().setWeekSummary('2026-06-08', 'Great week');
      expect(getEntryByDate('2026-06-09')!.ai?.weekSummary?.content).toBe('Great week');
      expect(getEntryByDate('2026-06-10')!.ai?.weekSummary?.content).toBe('Great week');
    });

    it('sets projects on entries', () => {
      useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task a\ntask b');
      const entry = getEntryByDate('2026-06-13')!;
      const bulletIds = entry.bullets.work.map((b) => b.id);

      useTimelineStore.getState().setProjects([{
        name: 'Project X',
        bulletRefs: [{ entryId: entry.id, bulletId: bulletIds[0] }],
      }]);

      const updated = getEntryByDate('2026-06-13')!;
      expect(updated.ai?.projects).toHaveLength(1);
      expect(updated.ai?.projects![0].name).toBe('Project X');
    });
  });
});

describe('selectors', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      entries: {
        '2026-06-12': {
          id: 'e1', date: '2026-06-12',
          bullets: { work: [{ id: 'b1', text: 'task' }], study: [], side: [] },
          createdAt: '', updatedAt: '',
        },
        '2026-06-13': {
          id: 'e2', date: '2026-06-13',
          bullets: { work: [{ id: 'b2', text: 'task' }], study: [], side: [] },
          createdAt: '', updatedAt: '',
        },
        '2026-07-01': {
          id: 'e3', date: '2026-07-01',
          bullets: { work: [{ id: 'b3', text: 'task' }], study: [], side: [] },
          createdAt: '', updatedAt: '',
        },
      },
      settings: { llm: { provider: 'openai-compatible', apiKey: '', model: '', baseUrl: '' }, export: { folderStructure: 'year-month', includeAI: true } },
      selectedMonth: '2026-06',
      view: 'cards',
      aiInFlight: {},
    });
  });

  it('getEntriesForMonth filters by month', () => {
    const entries = getEntriesForMonth('2026-06');
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.date.startsWith('2026-06'))).toBe(true);
  });

  it('getEntriesForWeek filters by week range', () => {
    // Week starting June 8
    const entries = getEntriesForWeek('2026-06-08');
    expect(entries).toHaveLength(2);
  });
});
