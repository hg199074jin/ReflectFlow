import type { Bullet } from './schema';
import { createId } from './ids';

/** Parse multi-line text into Bullet array. Strips leading "- " and skips blanks. */
export function parseBulletText(text: string): Bullet[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => (line.startsWith('- ') ? line.slice(2) : line))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => ({ id: createId(), text }));
}

/** Format Bullet array back to multi-line text (no dash prefix). */
export function formatBulletText(bullets: Bullet[]): string {
  return bullets.map((b) => b.text).join('\n');
}
