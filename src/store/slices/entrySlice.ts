import type { Entry, Category, DailyReview } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { createId } from '../../lib/ids';
import { parseBulletText } from '../../lib/text';
import { getWeekRange } from '../../lib/date';
import { saveEntry, deleteEntry as deleteEntryFromDB } from '../persistence';

export interface EntrySlice {
  entries: Record<string, Entry>;
  upsertEntryText: (date: string, category: Category, text: string) => void;
  deleteEntry: (date: string) => Promise<void>;
  setReflection: (date: string, content: string) => void;
  setAIQuestions: (date: string, questions: string[]) => void;
  setQuestionAnswers: (date: string, answers: string[]) => void;
  setWeekSummary: (weekStart: string, content: string) => void;
  setProjects: (projects: Array<{ name: string; bulletRefs: Array<{ entryId: string; bulletId: string }> }>) => void;
  updateDailyReview: (date: string, review: Partial<DailyReview>) => void;
}

export const createEntrySlice: SliceCreator<EntrySlice> = (set, get) => ({
  entries: {},

  upsertEntryText: (date, category, text) => {
    const { entries } = get();
    const bullets = parseBulletText(text);
    const existing = entries[date];
    const now = new Date().toISOString();

    const entry: Entry = existing
      ? {
          ...existing,
          bullets: { ...existing.bullets, [category]: bullets },
          rawText: { ...existing.rawText, [category]: text },
          updatedAt: now,
        }
      : {
          id: createId(),
          date,
          bullets: { work: [], study: [], side: [], [category]: bullets },
          rawText: { [category]: text },
          createdAt: now,
          updatedAt: now,
        };

    set({ entries: { ...entries, [date]: entry } });
    saveEntry(entry);
  },

  deleteEntry: async (date) => {
    const { entries } = get();
    const { [date]: _, ...rest } = entries;
    set({ entries: rest });
    await deleteEntryFromDB(date);
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

  setAIQuestions: (date, questions) => {
    const { entries } = get();
    const entry = entries[date];
    if (!entry) return;
    const updated = {
      ...entry,
      ai: { ...entry.ai, questions },
      updatedAt: new Date().toISOString(),
    };
    set({ entries: { ...entries, [date]: updated } });
    saveEntry(updated);
  },

  setQuestionAnswers: (date, answers) => {
    const { entries } = get();
    const entry = entries[date];
    if (!entry) return;
    const updated = {
      ...entry,
      ai: { ...entry.ai, questionAnswers: answers },
      updatedAt: new Date().toISOString(),
    };
    set({ entries: { ...entries, [date]: updated } });
    saveEntry(updated);
  },

  updateDailyReview: (date, review) => {
    const { entries } = get();
    const existing = entries[date];
    const now = new Date().toISOString();

    const entry: Entry = existing
      ? {
          ...existing,
          review: { ...existing.review, ...review },
          updatedAt: now,
        }
      : {
          id: createId(),
          date,
          bullets: { work: [], study: [], side: [] },
          ai: {},
          review,
          createdAt: now,
          updatedAt: now,
        };

    set({ entries: { ...entries, [date]: entry } });
    saveEntry(entry);
  },

  setWeekSummary: (weekStart, content) => {
    const { entries } = get();
    const range = getWeekRange(weekStart);
    const updated = { ...entries };

    for (const [date, entry] of Object.entries(updated)) {
      if (date >= range.start && date <= range.end) {
        const newEntry = {
          ...entry,
          ai: { ...entry.ai, weekSummary: { weekStart, content } },
          updatedAt: new Date().toISOString(),
        };
        updated[date] = newEntry;
        saveEntry(newEntry);
      }
    }

    set({ entries: updated });
  },

  setProjects: (projects) => {
    const { entries } = get();
    const updated = { ...entries };

    const bulletToEntry = new Map<string, string>();
    for (const entry of Object.values(entries)) {
      for (const bullets of Object.values(entry.bullets)) {
        for (const bullet of bullets) {
          bulletToEntry.set(bullet.id, entry.id);
        }
      }
    }

    const entryProjects = new Map<string, typeof projects>();
    for (const project of projects) {
      for (const ref of project.bulletRefs) {
        const entryId = ref.entryId;
        if (!entryProjects.has(entryId)) entryProjects.set(entryId, []);
        const existing = entryProjects.get(entryId)!.find((p) => p.name === project.name);
        if (existing) {
          existing.bulletRefs.push(ref);
        } else {
          entryProjects.get(entryId)!.push({ name: project.name, bulletRefs: [ref] });
        }
      }
    }

    for (const [entryId, entryProjectList] of entryProjects) {
      const entry = Object.values(updated).find((e) => e.id === entryId) as Entry | undefined;
      if (entry) {
        const newEntry = {
          ...entry,
          ai: { ...entry.ai, projects: entryProjectList },
          updatedAt: new Date().toISOString(),
        };
        updated[entry.date] = newEntry;
        saveEntry(newEntry);
      }
    }

    set({ entries: updated });
  },
});
