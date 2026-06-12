import type { Entry, Settings } from '../lib/schema';

export const defaultSettings: Settings = {
  llm: {
    provider: 'openai-compatible',
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  export: {
    folderStructure: 'year-month',
    includeAI: true,
  },
};

export function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-entry-1',
    date: '2026-06-13',
    bullets: {
      work: [{ id: 'b1', text: 'Completed feature X' }],
      study: [{ id: 'b2', text: 'Read chapter 5' }],
      side: [],
    },
    createdAt: '2026-06-13T10:00:00Z',
    updatedAt: '2026-06-13T10:00:00Z',
    ...overrides,
  };
}

export function makeEntryWithAi(): Entry {
  return makeEntry({
    ai: {
      reflection: 'Productive day with good progress on feature X.',
      weekSummary: {
        weekStart: '2026-06-08',
        content: 'Strong week with consistent output.',
      },
    },
  });
}
