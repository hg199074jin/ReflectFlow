import { describe, it, expect } from 'vitest';
import { buildReflectionPrompt, buildWeekSummaryPrompt, buildProjectClassificationPrompt } from './prompts';
import { makeEntry } from '../test/fixtures';

describe('buildReflectionPrompt', () => {
  it('includes date and bullets', () => {
    const prompt = buildReflectionPrompt(makeEntry());
    expect(prompt).toContain('2026-06-13');
    expect(prompt).toContain('Completed feature X');
    expect(prompt).toContain('Read chapter 5');
  });

  it('skips empty categories', () => {
    const entry = makeEntry({ bullets: { work: [{ id: 'b1', text: 'task' }], study: [], side: [] } });
    const prompt = buildReflectionPrompt(entry);
    expect(prompt).not.toContain('Study:');
    expect(prompt).not.toContain('Side projects:');
  });
});

describe('buildWeekSummaryPrompt', () => {
  it('includes all entries', () => {
    const entries = [
      makeEntry({ id: 'e1', date: '2026-06-08' }),
      makeEntry({ id: 'e2', date: '2026-06-09' }),
    ];
    const prompt = buildWeekSummaryPrompt(entries, '2026-06-08');
    expect(prompt).toContain('2026-06-08');
    expect(prompt).toContain('2026-06-09');
  });
});

describe('buildProjectClassificationPrompt', () => {
  it('includes bullet IDs and text', () => {
    const bullets = [
      { entryId: 'e1', date: '2026-06-13', category: 'work' as const, bulletId: 'b1', text: 'task a' },
      { entryId: 'e1', date: '2026-06-13', category: 'work' as const, bulletId: 'b2', text: 'task b' },
    ];
    const prompt = buildProjectClassificationPrompt(bullets);
    expect(prompt).toContain('[b1]');
    expect(prompt).toContain('[b2]');
    expect(prompt).toContain('task a');
    expect(prompt).toContain('task b');
  });

  it('requests JSON format', () => {
    const prompt = buildProjectClassificationPrompt([]);
    expect(prompt).toContain('JSON');
  });
});
