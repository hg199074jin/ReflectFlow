import type { Entry, ClassifiableBullet } from '../../lib/schema';

/**
 * Map classified projects from provider response to entry bullet refs
 */
export function mapClassifiedProjectsToRefs(
  projects: Array<{ name: string; bulletIds: string[] }>,
  classifiableBullets: ClassifiableBullet[],
): Array<{ name: string; bulletRefs: Array<{ entryId: string; bulletId: string }> }> {
  // Build lookup: bulletId -> { entryId, bulletId }
  const bulletLookup = new Map<string, { entryId: string; bulletId: string }>();
  for (const bullet of classifiableBullets) {
    bulletLookup.set(bullet.bulletId, { entryId: bullet.entryId, bulletId: bullet.bulletId });
  }

  return projects.map((project) => ({
    name: project.name,
    bulletRefs: project.bulletIds
      .map((id) => bulletLookup.get(id))
      .filter((ref): ref is { entryId: string; bulletId: string } => !!ref),
  }));
}

/**
 * Rename a theme across all entries
 */
export function renameTheme(
  entries: Record<string, Entry>,
  oldName: string,
  newName: string,
): Record<string, Entry> {
  const updated = { ...entries };

  for (const [date, entry] of Object.entries(updated)) {
    if (entry.ai?.projects) {
      const projects = entry.ai.projects.map((p) =>
        p.name === oldName ? { ...p, name: newName } : p
      );
      updated[date] = {
        ...entry,
        ai: { ...entry.ai, projects },
        updatedAt: new Date().toISOString(),
      };
    }
  }

  return updated;
}

/**
 * Merge source theme into target theme
 */
export function mergeThemes(
  entries: Record<string, Entry>,
  sourceName: string,
  targetName: string,
): Record<string, Entry> {
  const updated = { ...entries };

  for (const [date, entry] of Object.entries(updated)) {
    if (entry.ai?.projects) {
      const source = entry.ai.projects.find((p) => p.name === sourceName);

      if (source) {
        const projects = entry.ai.projects
          .filter((p) => p.name !== sourceName)
          .map((p) => {
            if (p.name === targetName) {
              return { ...p, bulletRefs: [...p.bulletRefs, ...source.bulletRefs] };
            }
            return p;
          });

        updated[date] = {
          ...entry,
          ai: { ...entry.ai, projects },
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  return updated;
}

/**
 * Remove a bullet ref from a theme
 */
export function removeBulletFromTheme(
  entries: Record<string, Entry>,
  themeName: string,
  bulletId: string,
): Record<string, Entry> {
  const updated = { ...entries };

  for (const [date, entry] of Object.entries(updated)) {
    if (entry.ai?.projects) {
      const projects = entry.ai.projects.map((p) => {
        if (p.name === themeName) {
          return {
            ...p,
            bulletRefs: p.bulletRefs.filter((r) => r.bulletId !== bulletId),
          };
        }
        return p;
      }).filter((p) => p.bulletRefs.length > 0); // Remove empty projects

      updated[date] = {
        ...entry,
        ai: { ...entry.ai, projects },
        updatedAt: new Date().toISOString(),
      };
    }
  }

  return updated;
}

/**
 * Get all unique theme names from entries
 */
export function getAllThemes(entries: Record<string, Entry>): string[] {
  const themes = new Set<string>();

  for (const entry of Object.values(entries)) {
    if (entry.ai?.projects) {
      for (const project of entry.ai.projects) {
        themes.add(project.name);
      }
    }
  }

  return Array.from(themes).sort();
}
