import { describe, it, expect } from 'vitest';
import { entryToMarkdown, entryExportPath } from './markdown';
import { makeEntry, makeEntryWithAi } from '../../test/fixtures';

describe('entryToMarkdown', () => {
  it('serializes entry to markdown with all categories', () => {
    const entry = makeEntry({
      bullets: {
        work: [{ id: 'b1', text: 'Completed feature X' }],
        study: [{ id: 'b2', text: 'Read chapter 5' }],
        side: [{ id: 'b3', text: 'Posted blog article' }],
      },
    });
    const md = entryToMarkdown(entry, { includeAI: false });
    expect(md).toContain('# 2026-06-13');
    expect(md).toContain('## Work');
    expect(md).toContain('- Completed feature X');
    expect(md).toContain('## Study');
    expect(md).toContain('- Read chapter 5');
    expect(md).toContain('## Side');
    expect(md).toContain('- Posted blog article');
  });

  it('includes AI sections when includeAI is true', () => {
    const entry = makeEntryWithAi();
    const md = entryToMarkdown(entry, { includeAI: true });
    expect(md).toContain('## Reflection (AI)');
    expect(md).toContain('Productive day');
    expect(md).toContain('## Week Summary (AI)');
    expect(md).toContain('Strong week');
  });

  it('excludes AI sections when includeAI is false', () => {
    const entry = makeEntryWithAi();
    const md = entryToMarkdown(entry, { includeAI: false });
    expect(md).not.toContain('Reflection');
    expect(md).not.toContain('Week Summary');
  });

  it('skips empty categories', () => {
    const entry = makeEntry({ bullets: { work: [{ id: 'b1', text: 'task' }], study: [], side: [] } });
    const md = entryToMarkdown(entry, { includeAI: false });
    expect(md).toContain('## Work');
    expect(md).not.toContain('## Study');
    expect(md).not.toContain('## Side');
  });
});

describe('entryExportPath', () => {
  it('returns flat path', () => {
    const entry = makeEntry();
    expect(entryExportPath(entry, 'flat')).toBe('journal/2026-06-13.md');
  });

  it('returns year-month path', () => {
    const entry = makeEntry();
    expect(entryExportPath(entry, 'year-month')).toBe('journal/2026/06/2026-06-13.md');
  });
});
