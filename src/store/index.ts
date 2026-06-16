import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getWeekRange } from '../lib/date';
import type {
  Entry, Category, ViewMode, AppMode,
  WeeklyReview, Goal, GeneratedReport, Insight,
  ReviewCase, PreviewPlan, Principle,
} from '../lib/schema';
import {
  loadEntries, loadSettings, loadWeeklyReviews,
  loadGoals, loadReports, loadInsights,
  loadReviewCases, loadPreviewPlans, loadPrinciples,
  loadGoalFinalReports, loadGoalPrincipleExtractions,
  loadGoalPlans, loadDailyGoalTargets,
} from './persistence';

import { createEntrySlice, type EntrySlice } from './slices/entrySlice';
import { createGoalSlice, type GoalSlice } from './slices/goalSlice';
import { createReviewSlice, type ReviewSlice } from './slices/reviewSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { createAISlice, type AISlice } from './slices/aiSlice';
import { createInsightSlice, type InsightSlice } from './slices/insightSlice';
import { createReportSlice, type ReportSlice } from './slices/reportSlice';
import { createPrincipleSlice, type PrincipleSlice } from './slices/principleSlice';
import { createPreviewSlice, type PreviewSlice } from './slices/previewSlice';

type StoreState = EntrySlice & GoalSlice & ReviewSlice & SettingsSlice & AISlice & InsightSlice & ReportSlice & PrincipleSlice & PreviewSlice & {
  // UI state not yet in a slice
  selectedMonth: string;
  view: ViewMode;
  appMode: AppMode;
  setView: (view: ViewMode) => void;
  setAppMode: (mode: AppMode) => void;
  setSelectedMonth: (month: string) => void;
  initialize: () => Promise<void>;
};

export const useTimelineStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createEntrySlice(...args),
      ...createGoalSlice(...args),
      ...createReviewSlice(...args),
      ...createSettingsSlice(...args),
      ...createAISlice(...args),
      ...createInsightSlice(...args),
      ...createReportSlice(...args),
      ...createPrincipleSlice(...args),
      ...createPreviewSlice(...args),

      // UI state
      selectedMonth: new Date().toISOString().slice(0, 7),
      view: 'cards',
      appMode: 'checkin',

      setView: (view) => args[0]({ view }),
      setAppMode: (mode) => args[0]({ appMode: mode }),
      setSelectedMonth: (month) => args[0]({ selectedMonth: month }),

      // initialize — loads all data from IndexedDB on app start
      // Registry pattern: each entry maps a store key to its load function + optional transform.
      // To add a new entity: add one line here and ensure the slice has the matching state key.
      initialize: async () => {
        // Loaders that return the value directly (single object or already a map)
        const directLoaders: Array<[keyof StoreState, () => Promise<unknown>]> = [
          ['settings', loadSettings],
          ['weeklyReviews', loadWeeklyReviews],
          ['goals', loadGoals],
          ['reports', loadReports],
          ['insights', loadInsights],
          ['reviewCases', loadReviewCases],
          ['previewPlans', loadPreviewPlans],
          ['principles', loadPrinciples],
        ];

        // Loaders that return arrays and need id-keyed map conversion
        type ArrayLoader = [string, () => Promise<Array<Record<string, unknown>>>, (item: Record<string, unknown>) => string];
        const arrayLoaders: ArrayLoader[] = [
          ['entries', loadEntries, (e) => (e as Entry).date],
          ['goalFinalReports', loadGoalFinalReports, (r) => (r as import('../lib/schema').GoalFinalReport).id],
          ['goalPrincipleExtractions', loadGoalPrincipleExtractions, (p) => (p as import('../lib/schema').GoalPrincipleExtraction).id],
          ['goalPlans', loadGoalPlans, (p) => (p as import('../lib/schema').GoalPlan).id],
          ['dailyGoalTargets', loadDailyGoalTargets, (t) => (t as import('../lib/schema').DailyGoalTarget).id],
        ];

        // Run all loaders in parallel
        const directResults = await Promise.all(directLoaders.map(([, fn]) => fn()));
        const arrayResults = await Promise.all(arrayLoaders.map(([, fn]) => fn()));

        // Build the partial state
        const partial: Record<string, unknown> = {};
        directLoaders.forEach(([key], i) => { partial[key as string] = directResults[i]; });
        arrayLoaders.forEach(([key, , keyFn], i) => {
          const map: Record<string, unknown> = {};
          const items = arrayResults[i] ?? [];
          for (const item of items) {
            map[keyFn(item)] = item;
          }
          partial[key] = map;
        });

        args[0](partial as Partial<StoreState>);
      },
    }),
    { name: 'TimelineStore' },
  ),
);

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

/** Get review cases for a period */
export function getReviewCasesForPeriod(startDate: string, endDate: string): ReviewCase[] {
  const { reviewCases } = useTimelineStore.getState();
  return Object.values(reviewCases).filter(
    (rc) => rc.startDate >= startDate && rc.endDate <= endDate
  );
}

/** Get principles by verification status */
export function getPrinciplesByVerificationStatus(status: Principle['verificationStatus']): Principle[] {
  const { principles } = useTimelineStore.getState();
  return Object.values(principles).filter((p) => p.verificationStatus === status);
}

/** Get preview plans for a period */
export function getPreviewPlansForPeriod(startDate: string, endDate: string): PreviewPlan[] {
  const { previewPlans } = useTimelineStore.getState();
  return Object.values(previewPlans).filter(
    (pp) => pp.startDate >= startDate && pp.endDate <= endDate
  );
}
