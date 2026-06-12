import { describe, it, expect } from 'vitest';
import { toDateKey, toMonthKey, getMonthDays, getWeekRange, calculateStreak } from './date';
import type { Entry } from './schema';

describe('toDateKey', () => {
  it('returns local YYYY-MM-DD', () => {
    const d = new Date(2026, 5, 13); // June 13, 2026
    expect(toDateKey(d)).toBe('2026-06-13');
  });

  it('handles single-digit months and days', () => {
    const d = new Date(2026, 0, 5); // Jan 5, 2026
    expect(toDateKey(d)).toBe('2026-01-05');
  });
});

describe('toMonthKey', () => {
  it('extracts YYYY-MM from date key', () => {
    expect(toMonthKey('2026-06-13')).toBe('2026-06');
  });

  it('handles year boundary', () => {
    expect(toMonthKey('2025-12-31')).toBe('2025-12');
  });
});

describe('getMonthDays', () => {
  it('returns all days for June 2026', () => {
    const days = getMonthDays('2026-06');
    expect(days).toHaveLength(30);
    expect(days[0]).toBe('2026-06-01');
    expect(days[29]).toBe('2026-06-30');
  });

  it('returns all days for February 2024 (leap year)', () => {
    const days = getMonthDays('2024-02');
    expect(days).toHaveLength(29);
    expect(days[28]).toBe('2024-02-29');
  });
});

describe('getWeekRange', () => {
  it('returns Monday to Sunday for a mid-week date', () => {
    // June 13, 2026 is a Saturday
    const range = getWeekRange('2026-06-13');
    expect(range.start).toBe('2026-06-08'); // Monday
    expect(range.end).toBe('2026-06-14');   // Sunday
  });

  it('handles cross-month week', () => {
    // June 29, 2026 is a Monday
    const range = getWeekRange('2026-06-29');
    expect(range.start).toBe('2026-06-29');
    expect(range.end).toBe('2026-07-05');
  });
});

describe('calculateStreak', () => {
  const makeEntry = (date: string, hasBullets = true): Entry => ({
    id: `id-${date}`,
    date,
    bullets: {
      work: hasBullets ? [{ id: 'b1', text: 'task' }] : [],
      study: [],
      side: [],
    },
    createdAt: date,
    updatedAt: date,
  });

  it('counts consecutive days ending today', () => {
    const entries = [
      makeEntry('2026-06-11'),
      makeEntry('2026-06-12'),
      makeEntry('2026-06-13'),
    ];
    expect(calculateStreak(entries, '2026-06-13')).toBe(3);
  });

  it('stops at gap', () => {
    const entries = [
      makeEntry('2026-06-10'),
      // 11 missing
      makeEntry('2026-06-12'),
      makeEntry('2026-06-13'),
    ];
    expect(calculateStreak(entries, '2026-06-13')).toBe(2);
  });

  it('returns 0 if today has no entry', () => {
    const entries = [makeEntry('2026-06-12')];
    expect(calculateStreak(entries, '2026-06-13')).toBe(0);
  });

  it('returns 0 for empty entries', () => {
    expect(calculateStreak([], '2026-06-13')).toBe(0);
  });

  it('ignores entries with no bullets', () => {
    const entries = [
      makeEntry('2026-06-12', false),
      makeEntry('2026-06-13'),
    ];
    expect(calculateStreak(entries, '2026-06-13')).toBe(1);
  });
});
