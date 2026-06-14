import JSZip from 'jszip';
import type { Entry } from '../../lib/schema';
import { createId } from '../../lib/ids';

/**
 * Parse a markdown file back into an Entry
 * Expected format:
 * # YYYY-MM-DD
 *
 * ## Work
 * - bullet 1
 * - bullet 2
 *
 * ## Study
 * - bullet 1
 *
 * ## Side
 * - bullet 1
 */
export function parseMarkdownToEntry(content: string, dateKey: string): Entry | null {
  const lines = content.split('\n');
  const bullets = { work: [] as Array<{ id: string; text: string }>, study: [] as Array<{ id: string; text: string }>, side: [] as Array<{ id: string; text: string }> };

  let currentCategory: 'work' | 'study' | 'side' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect category headers
    if (trimmed === '## Work' || trimmed === '## 工作') {
      currentCategory = 'work';
      continue;
    }
    if (trimmed === '## Study' || trimmed === '## 学习') {
      currentCategory = 'study';
      continue;
    }
    if (trimmed === '## Side' || trimmed === '## 副业') {
      currentCategory = 'side';
      continue;
    }

    // Stop at AI sections
    if (trimmed.startsWith('## Reflection') || trimmed.startsWith('## Week Summary')) {
      currentCategory = null;
      continue;
    }

    // Parse bullet points
    if (currentCategory && trimmed.startsWith('- ')) {
      const text = trimmed.slice(2).trim();
      if (text) {
        bullets[currentCategory].push({ id: createId(), text });
      }
    }
  }

  const totalBullets = bullets.work.length + bullets.study.length + bullets.side.length;
  if (totalBullets === 0) return null;

  const now = new Date().toISOString();
  return {
    id: createId(),
    date: dateKey,
    bullets,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Import entries from a ZIP file
 * Returns entries that were successfully parsed
 */
export async function importFromZip(zipBlob: Blob): Promise<Entry[]> {
  const zip = await JSZip.loadAsync(zipBlob);
  const entries: Entry[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    if (!path.endsWith('.md')) continue;

    // Extract date from filename (YYYY-MM-DD.md)
    const dateMatch = path.match(/(\d{4}-\d{2}-\d{2})\.md$/);
    if (!dateMatch) continue;

    const dateKey = dateMatch[1]!;
    const content = await file.async('string');
    const entry = parseMarkdownToEntry(content, dateKey);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Import entries from a single markdown file
 */
export async function importFromMarkdownFile(file: File, dateKey: string): Promise<Entry | null> {
  const content = await file.text();
  return parseMarkdownToEntry(content, dateKey);
}
