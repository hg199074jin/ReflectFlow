import { describe, it, expect } from 'vitest';
import { parseBulletText, formatBulletText } from './text';

describe('parseBulletText', () => {
  it('parses lines into bullets', () => {
    const bullets = parseBulletText('task one\ntask two\ntask three');
    expect(bullets).toHaveLength(3);
    expect(bullets[0]!.text).toBe('task one');
    expect(bullets[1]!.text).toBe('task two');
    expect(bullets[2]!.text).toBe('task three');
  });

  it('strips leading dashes', () => {
    const bullets = parseBulletText('- task one\n- task two');
    expect(bullets).toHaveLength(2);
    expect(bullets[0]!.text).toBe('task one');
    expect(bullets[1]!.text).toBe('task two');
  });

  it('trims whitespace', () => {
    const bullets = parseBulletText('  task one  \n  task two  ');
    expect(bullets[0]!.text).toBe('task one');
  });

  it('skips empty lines', () => {
    const bullets = parseBulletText('task one\n\ntask two\n\n');
    expect(bullets).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(parseBulletText('')).toEqual([]);
    expect(parseBulletText('   ')).toEqual([]);
  });

  it('assigns unique ids', () => {
    const bullets = parseBulletText('a\nb');
    expect(bullets[0]!.id).not.toBe(bullets[1]!.id);
  });
});

describe('formatBulletText', () => {
  it('joins bullets with newlines', () => {
    const text = formatBulletText([
      { id: '1', text: 'task one' },
      { id: '2', text: 'task two' },
    ]);
    expect(text).toBe('task one\ntask two');
  });

  it('returns empty string for empty array', () => {
    expect(formatBulletText([])).toBe('');
  });
});

describe('roundtrip', () => {
  it('parse then format preserves text', () => {
    const input = 'task one\ntask two\ntask three';
    const bullets = parseBulletText(input);
    expect(formatBulletText(bullets)).toBe(input);
  });
});
