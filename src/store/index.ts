import { create } from 'zustand';
import { createId } from '../lib/ids';
import { parseBulletText } from '../lib/text';
import { getWeekRange } from '../lib/date';
import type {
  Entry, Settings, Category, ViewMode, AppMode,
  DailyReview, WeeklyReview, Goal, GeneratedReport, Insight,
} from '../lib/schema';
import {
  saveEntry, loadEntries, loadSettings, saveSettings,
  saveWeeklyReview, loadWeeklyReviews,
  saveGoal, loadGoals, deleteGoal as deleteGoalFromDB,
  saveReport, loadReports, deleteReport as deleteReportFromDB,
  loadInsights, clearInsights as clearInsightsFromDB,
} from './persistence';

interface AppState {
  entries: Record<string, Entry>;
  weeklyReviews: Record<string, WeeklyReview>;
  goals: Record<string, Goal>;
  reports: Record<string, GeneratedReport>;
  insights: Record<string, Insight>;
  settings: Settings;
  selectedMonth: string;
  view: ViewMode;
  appMode: AppMode;
  aiInFlight: Record<string, boolean>;

  // Actions
  initialize: () => Promise<void>;
  upsertEntryText: (date: string, category: Category, text: string) => void;
  setView: (view: ViewMode) => void;
  setAppMode: (mode: AppMode) => void;
  setSelectedMonth: (month: string) => void;
  saveSettings: (settings: Settings) => Promise<void>;
  setAIInFlight: (key: string, inFlight: boolean) => void;
  setReflection: (date: string, content: string) => void;
  setAIQuestions: (date: string, questions: string[]) => void;
  setWeekSummary: (weekStart: string, content: string) => void;
  setProjects: (projects: Array<{ name: string; bulletRefs: Array<{ entryId: string; bulletId: string }> }>) => void;
  updateDailyReview: (date: string, review: Partial<DailyReview>) => void;
  updateWeeklyReview: (weekStart: string, review: Partial<WeeklyReview>) => void;

  // Pro actions
  upsertGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  linkBulletToGoal: (goalId: string, ref: { entryId: string; bulletId: string }) => Promise<void>;
  unlinkBulletFromGoal: (goalId: string, bulletId: string) => Promise<void>;
  saveGeneratedReport: (report: GeneratedReport) => Promise<void>;
  deleteGeneratedReport: (reportId: string) => Promise<void>;
  saveInsights: (insights: Insight[]) => Promise<void>;
  clearInsights: () => Promise<void>;
}

export const useTimelineStore = create<AppState>((set, get) => ({
  entries: {},
  weeklyReviews: {},
  goals: {},
  reports: {},
  insights: {},
  settings: {
    llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
    export: { folderStructure: 'year-month', includeAI: true },
  },
  selectedMonth: new Date().toISOString().slice(0, 7),
  view: 'cards',
  appMode: 'checkin',
  aiInFlight: {},

  initialize: async () => {
    const [entries, settings, weeklyReviews, goals, reports, insights] = await Promise.all([
      loadEntries(), loadSettings(), loadWeeklyReviews(),
      loadGoals(), loadReports(), loadInsights(),
    ]);
    const entriesMap: Record<string, Entry> = {};
    for (const e of entries) {
      entriesMap[e.date] = e;
    }
    set({
      entries: entriesMap, settings, weeklyReviews,
      goals, reports, insights,
    });
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
  setAppMode: (mode) => set({ appMode: mode }),
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

  updateWeeklyReview: (weekStart, review) => {
    const { weeklyReviews } = get();
    const existing = weeklyReviews[weekStart];

    const updated: WeeklyReview = existing
      ? { ...existing, ...review, weekStart }
      : { weekStart, ...review };

    const newWeeklyReviews = { ...weeklyReviews, [weekStart]: updated };
    set({ weeklyReviews: newWeeklyReviews });
    saveWeeklyReview(updated);
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

  // Pro actions
  upsertGoal: async (goal) => {
    const { goals } = get();
    set({ goals: { ...goals, [goal.id]: goal } });
    await saveGoal(goal);
  },

  deleteGoal: async (goalId) => {
    const { goals } = get();
    const { [goalId]: _, ...rest } = goals;
    set({ goals: rest });
    await deleteGoalFromDB(goalId);
  },

  linkBulletToGoal: async (goalId, ref) => {
    const { goals } = get();
    const goal = goals[goalId];
    if (!goal) return;

    // Deduplicate
    const exists = goal.linkedBullets.some(
      (b) => b.entryId === ref.entryId && b.bulletId === ref.bulletId
    );
    if (exists) return;

    const updated = {
      ...goal,
      linkedBullets: [...goal.linkedBullets, ref],
      updatedAt: new Date().toISOString(),
    };
    set({ goals: { ...goals, [goalId]: updated } });
    await saveGoal(updated);
  },

  unlinkBulletFromGoal: async (goalId, bulletId) => {
    const { goals } = get();
    const goal = goals[goalId];
    if (!goal) return;

    const updated = {
      ...goal,
      linkedBullets: goal.linkedBullets.filter((b) => b.bulletId !== bulletId),
      updatedAt: new Date().toISOString(),
    };
    set({ goals: { ...goals, [goalId]: updated } });
    await saveGoal(updated);
  },

  saveGeneratedReport: async (report) => {
    const { reports } = get();
    set({ reports: { ...reports, [report.id]: report } });
    await saveReport(report);
  },

  deleteGeneratedReport: async (reportId) => {
    const { reports } = get();
    const { [reportId]: _, ...rest } = reports;
    set({ reports: rest });
    await deleteReportFromDB(reportId);
  },

  saveInsights: async (newInsights) => {
    const { insights } = get();
    const updated = { ...insights };
    for (const insight of newInsights) {
      updated[insight.id] = insight;
    }
    set({ insights: updated });
    // Save each insight
    for (const insight of newInsights) {
      await saveInsightToDB(insight);
    }
  },

  clearInsights: async () => {
    set({ insights: {} });
    await clearInsightsFromDB();
  },
}));

// Helper to save insight
async function saveInsightToDB(insight: Insight): Promise<void> {
  const { saveInsight } = await import('./persistence');
  await saveInsight(insight);
}

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
    for (const [category, categoryBullets] of Object.entries(entry.bullets) as [Category, Array<{ id: string; text: string }>][] ) {
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

/** Get weekly review data by aggregating entries */
export function getWeeklyReviewData(weekStart: string): WeeklyReview {
  const entries = getEntriesForWeek(weekStart);
  const allBullets = entries.flatMap((e) => [...e.bullets.work, ...e.bullets.study, ...e.bullets.side]);

  return {
    weekStart,
    completed: allBullets.map((b) => `- ${b.text}`).join('\n'),
  };
}

/** Get review statistics for a month */
export function getMonthReviewStats(month: string) {
  const entries = getEntriesForMonth(month);
  const reviewDays = entries.filter((e) => e.review && (
    e.review.target || e.review.gap || e.review.reason || e.review.lesson
  )).length;

  const tags: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.review?.tags) {
      for (const tag of entry.review.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
    }
  }

  const qualities = entries
    .filter((e) => e.review?.quality)
    .map((e) => e.review!.quality!);
  const avgQuality = qualities.length > 0
    ? qualities.reduce((a, b) => a + b, 0) / qualities.length
    : 0;

  return {
    totalDays: entries.length,
    reviewDays,
    tags,
    avgQuality: Math.round(avgQuality * 10) / 10,
  };
}

/** Get goals for a period */
export function getGoalsForPeriod(period: 'week' | 'month', startDate: string, endDate: string): Goal[] {
  const { goals } = useTimelineStore.getState();
  return Object.values(goals).filter(
    (g) => g.period === period && g.startDate >= startDate && g.endDate <= endDate
  );
}

/** Get reports for a period */
export function getReportsForPeriod(startDate: string, endDate: string): GeneratedReport[] {
  const { reports } = useTimelineStore.getState();
  return Object.values(reports).filter(
    (r) => r.startDate >= startDate && r.endDate <= endDate
  );
}

/** Get insights for a period */
export function getInsightsForPeriod(startDate: string, endDate: string): Insight[] {
  const { insights } = useTimelineStore.getState();
  return Object.values(insights).filter(
    (i) => i.periodStart >= startDate && i.periodEnd <= endDate
  );
}
