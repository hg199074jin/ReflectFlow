import { describe, it, expect } from 'vitest';
import { entrySchema, settingsSchema, categorySchema } from './schema';

describe('categorySchema', () => {
  it('accepts valid categories', () => {
    expect(categorySchema.parse('work')).toBe('work');
    expect(categorySchema.parse('study')).toBe('study');
    expect(categorySchema.parse('side')).toBe('side');
  });

  it('rejects invalid category', () => {
    expect(() => categorySchema.parse('invalid')).toThrow();
  });
});

describe('entrySchema', () => {
  const validEntry = {
    id: 'abc-123',
    date: '2026-06-13',
    bullets: {
      work: [{ id: 'b1', text: 'task' }],
      study: [],
      side: [],
    },
    createdAt: '2026-06-13T10:00:00Z',
    updatedAt: '2026-06-13T10:00:00Z',
  };

  it('accepts valid entry', () => {
    const result = entrySchema.parse(validEntry);
    expect(result.id).toBe('abc-123');
    expect(result.bullets.work).toHaveLength(1);
  });

  it('accepts entry with AI data', () => {
    const withAi = {
      ...validEntry,
      ai: {
        reflection: 'Good day',
        weekSummary: { weekStart: '2026-06-08', content: 'Productive week' },
      },
    };
    const result = entrySchema.parse(withAi);
    expect(result.ai?.reflection).toBe('Good day');
  });

  it('rejects missing required fields', () => {
    expect(() => entrySchema.parse({ id: 'abc' })).toThrow();
  });
});

describe('settingsSchema', () => {
  const validSettings = {
    llm: {
      provider: 'openai-compatible',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
    },
    export: {
      folderStructure: 'year-month',
      includeAI: true,
    },
  };

  it('accepts valid settings', () => {
    const result = settingsSchema.parse(validSettings);
    expect(result.llm.provider).toBe('openai-compatible');
  });

  it('accepts settings with optional apiKey', () => {
    const withKey = { ...validSettings, llm: { ...validSettings.llm, apiKey: 'sk-xxx' } };
    const result = settingsSchema.parse(withKey);
    expect(result.llm.apiKey).toBe('sk-xxx');
  });

  it('rejects invalid provider', () => {
    const bad = { ...validSettings, llm: { ...validSettings.llm, provider: 'invalid' } };
    expect(() => settingsSchema.parse(bad)).toThrow();
  });

  it('rejects invalid folder structure', () => {
    const bad = { ...validSettings, export: { ...validSettings.export, folderStructure: 'bad' } };
    expect(() => settingsSchema.parse(bad)).toThrow();
  });
});
