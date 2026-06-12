import { describe, it, expect } from 'vitest';
import { buildEvidenceRefs, getAllEvidenceRefs } from './evidence';
import type { Entry } from '../../lib/schema';

const mockEntries: Record<string, Entry> = {
  '2026-06-13': {
    id: 'entry-1',
    date: '2026-06-13',
    bullets: {
      work: [{ id: 'b1', text: 'Completed feature X' }, { id: 'b2', text: 'Fixed bug Y' }],
      study: [{ id: 'b3', text: 'Read chapter 5' }],
      side: [],
    },
    createdAt: '2026-06-13T10:00:00Z',
    updatedAt: '2026-06-13T10:00:00Z',
  },
  '2026-06-12': {
    id: 'entry-2',
    date: '2026-06-12',
    bullets: {
      work: [{ id: 'b4', text: 'Design review' }],
      study: [],
      side: [{ id: 'b5', text: 'Blog post' }],
    },
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-06-12T10:00:00Z',
  },
};

describe('buildEvidenceRefs', () => {
  it('builds refs from valid bullet ids', () => {
    const refs = buildEvidenceRefs(mockEntries, [
      { entryId: 'entry-1', bulletId: 'b1' },
      { entryId: 'entry-1', bulletId: 'b3' },
    ]);
    expect(refs).toHaveLength(2);
    expect(refs[0]!.text).toBe('Completed feature X');
    expect(refs[0]!.category).toBe('work');
    expect(refs[1]!.text).toBe('Read chapter 5');
    expect(refs[1]!.category).toBe('study');
  });

  it('ignores missing entry ids', () => {
    const refs = buildEvidenceRefs(mockEntries, [
      { entryId: 'nonexistent', bulletId: 'b1' },
    ]);
    expect(refs).toHaveLength(0);
  });

  it('ignores missing bullet ids', () => {
    const refs = buildEvidenceRefs(mockEntries, [
      { entryId: 'entry-1', bulletId: 'nonexistent' },
    ]);
    expect(refs).toHaveLength(0);
  });

  it('preserves date and entryId', () => {
    const refs = buildEvidenceRefs(mockEntries, [
      { entryId: 'entry-2', bulletId: 'b5' },
    ]);
    expect(refs[0]!.date).toBe('2026-06-12');
    expect(refs[0]!.entryId).toBe('entry-2');
  });
});

describe('getAllEvidenceRefs', () => {
  it('returns all bullets as evidence refs', () => {
    const refs = getAllEvidenceRefs(mockEntries);
    expect(refs).toHaveLength(5);
  });

  it('includes all categories', () => {
    const refs = getAllEvidenceRefs(mockEntries);
    const categories = new Set(refs.map((r) => r.category));
    expect(categories.has('work')).toBe(true);
    expect(categories.has('study')).toBe(true);
    expect(categories.has('side')).toBe(true);
  });

  it('returns empty for empty entries', () => {
    expect(getAllEvidenceRefs({})).toEqual([]);
  });
});
