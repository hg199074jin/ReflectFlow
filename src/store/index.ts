import { create } from 'zustand';
import { createId } from '../lib/ids';
import { parseBulletText } from '../lib/text';
import { getWeekRange } from '../lib/date';
import type { Entry, Settings, Category, ViewMode } from '../lib/schema';
import { saveEntry, loadEntries, loadSettings, saveSettings } from './persistence';

interface AppState {
  entries: Record<string, Entry>;
  settings: Settings;
  selectedMonth: string;
  view: ViewMode;
  aiInFlight: Record<string, boolean>;

  // Actions
  initialize: () => Promise<void>;
  upsertEntryText: (date: string, category: Category, text: string) => void;
  setView: (view: ViewMode) => void;
  setSelectedMonth: (month: string) => void;
  saveSettings: (settings: Settings) => Promise<void>;
  setAIInFlight: (key: string, inFlight: boolean) => void;
  setReflection: (date: string, content: string) => void;
  setWeekSummary: (weekStart: string, content: string) => void;
  setProjects: (projects: Array<{ name: string; bulletRefs: Array<{ entryId: string; bulletId: string }> }>) => void;
}

export const useTimelineStore = create<AppState>((set, get) => ({
  entries: {},
  settings: {
    llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
    export: { folderStructure: 'year-month', includeAI: true },
  },
  selectedMonth: new Date().toISOString().slice(0, 7),
  view: 'cards',
  aiInFlight: {},

  initialize: async () => {
    const [entries, settings] = await Promise.all([loadEntries(), loadSettings()]);
    const entriesMap: Record<string, Entry> = {};
    for (const e of entries) {
      entriesMap[e.date] = e;
    }
    set({ entries: entriesMap, settings });
  },

  upsertEntryText: (date, category, text) => {
    const { entries } = get();
    const bullets = parseBulletText(text);
    const existing = entries[date];
    const now = new Date().toISOString();

    const entry: Entry = existing
      ? { ...existing, bullets: { ...existing.bullets, [category]: bullets }, updatedAt: now }
      : {
          id: createId(),
          date,
          bullets: { work: [], study: [], side: [], [category]: bullets },
          createdAt: now,
          updatedAt: now,
        };

    set({ entries: { ...entries, [date]: entry } });
    saveEntry(entry);
  },

  setView: (view) => set({ view }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),

  saveSettings: async (settings) => {
    await saveSettings(settings);
    set({ settings });
  },

  setAIInFlight: (key, inFlight) => {
    set((state) => ({
      aiInFlight: inFlight
        ? { ...state.aiInFlight, [key]: true }
        : Object.fromEntries(Object.entries(state.aiInFlight).filter(([k]) => k !== key)),
    }));
  },

  setReflection: (date, content) => {
    const { entries } = get();
    const entry = entries[date];
    if (!entry) return;
    const updated = {
      ...entry,
      ai: { ...entry.ai, reflection: content },
      updatedAt: new Date().toISOString(),
    };
    set({ entries: { ...entries, [date]: updated } });
    saveEntry(updated);
  },

  setWeekSummary: (weekStart, content) => {
    const { entries } = get();
    const range = getWeekRange(weekStart);
    const updated = { ...entries };

    // Update all entries in the week
    for (const [date, entry] of Object.entries(updated)) {
      if (date >= range.start && date <= range.end) {
        updated[date] = {
          ...entry,
          ai: { ...entry.ai, weekSummary: { weekStart, content } },
          updatedAt: new Date().toISOString(),
        };
        saveEntry(updated[date]);
      }
    }

    set({ entries: updated });
  },

  setProjects: (projects) => {
    const { entries } = get();
    const updated = { ...entries };

    // Build a map of bulletId -> entryId for quick lookup
    const bulletToEntry = new Map<string, string>();
    for (const entry of Object.values(entries)) {
      for (const bullets of Object.values(entry.bullets)) {
        for (const bullet of bullets) {
          bulletToEntry.set(bullet.id, entry.id);
        }
      }
    }

    // Group bullet refs by entry
    const entryProjects = new Map<string, typeof projects>();
    for (const project of projects) {
      for (const ref of project.bulletRefs) {
        const entryId = ref.entryId;
        if (!entryProjects.has(entryId)) entryProjects.set(entryId, []);
        // Find or create project entry for this entry
        const existing = entryProjects.get(entryId)!.find((p) => p.name === project.name);
        if (existing) {
          existing.bulletRefs.push(ref);
        } else {
          entryProjects.get(entryId)!.push({ name: project.name, bulletRefs: [ref] });
        }
      }
    }

    // Update each entry with its projects
    for (const [entryId, entryProjectList] of entryProjects) {
      const entry = Object.values(updated).find((e) => e.id === entryId);
      if (entry) {
        updated[entry.date] = {
          ...entry,
          ai: { ...entry.ai, projects: entryProjectList },
          updatedAt: new Date().toISOString(),
        };
        saveEntry(updated[entry.date]);
      }
    }

    set({ entries: updated });
  },
}));

/** Get entry by date key */
export function getEntryByDate(date: string): Entry | undefined {
  return useTimelineStore.getState().entries[date];
}

/** Get all entries for a given month ('YYYY-MM') */
export function getEntriesForMonth(month: string): Entry[] {
  const { entries } = useTimelineStore.getState();
  return Object.values(entries).filter((e) => e.date.startsWith(month));
}

/** Get all entries within the week containing weekStart */
export function getEntriesForWeek(weekStart: string): Entry[] {
  const { entries } = useTimelineStore.getState();
  const range = getWeekRange(weekStart);
  return Object.values(entries).filter((e) => e.date >= range.start && e.date <= range.end);
}

/** Get all bullets for a month, flattened with metadata for classification */
export function getClassifiableBullets(month: string) {
  const entries = getEntriesForMonth(month);
  const bullets: Array<{ entryId: string; date: string; category: Category; bulletId: string; text: string }> = [];
  for (const entry of entries) {
    for (const [category, categoryBullets] of Object.entries(entry.bullets) as [Category, typeof entry.bullets.work][]) {
      for (const bullet of categoryBullets) {
        bullets.push({
          entryId: entry.id,
          date: entry.date,
          category,
          bulletId: bullet.id,
          text: bullet.text,
        });
      }
    }
  }
  return bullets;
}
