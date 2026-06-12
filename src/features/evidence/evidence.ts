import type { Entry, EvidenceRef } from '../../lib/schema';

/**
 * Build evidence refs from bullet references
 */
export function buildEvidenceRefs(
  entries: Record<string, Entry>,
  refs: Array<{ entryId: string; bulletId: string }>,
): EvidenceRef[] {
  const result: EvidenceRef[] = [];

  for (const ref of refs) {
    // Find entry by id
    const entry = Object.values(entries).find((e) => e.id === ref.entryId);
    if (!entry) continue;

    // Find bullet in work/study/side
    for (const [category, bullets] of Object.entries(entry.bullets) as [string, Array<{ id: string; text: string }>][]) {
      const bullet = bullets.find((b) => b.id === ref.bulletId);
      if (bullet) {
        result.push({
          entryId: entry.id,
          date: entry.date,
          category: category as 'work' | 'study' | 'side',
          bulletId: bullet.id,
          text: bullet.text,
        });
        break;
      }
    }
  }

  return result;
}

/**
 * Get all evidence refs from all entries
 */
export function getAllEvidenceRefs(entries: Record<string, Entry>): EvidenceRef[] {
  const result: EvidenceRef[] = [];

  for (const entry of Object.values(entries)) {
    for (const [category, bullets] of Object.entries(entry.bullets) as [string, Array<{ id: string; text: string }>][]) {
      for (const bullet of bullets) {
        result.push({
          entryId: entry.id,
          date: entry.date,
          category: category as 'work' | 'study' | 'side',
          bulletId: bullet.id,
          text: bullet.text,
        });
      }
    }
  }

  return result;
}
