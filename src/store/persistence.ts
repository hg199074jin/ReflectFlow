import { openDB, type IDBPDatabase } from 'idb';
import {
  entrySchema, settingsSchema, weeklyReviewSchema,
  goalSchema, generatedReportSchema, insightSchema,
  reviewCaseSchema, previewPlanSchema, principleSchema,
  goalPlanSchema, dailyGoalTargetSchema, goalConflictSchema,
  goalPremortemSchema,
  type Entry, type Settings, type WeeklyReview,
  type Goal, type GeneratedReport, type Insight,
  type ReviewCase, type PreviewPlan, type Principle,
  type GoalPlan, type DailyGoalTarget, type GoalConflict,
  type WeeklyGoalReview, type GoalFinalReport,
  type GoalPrincipleExtraction, type GoalPremortem, type GoalPremortemReview,
} from '../lib/schema';

export const DB_NAME = 'timeline-db';
export const DB_VERSION = 5;
const ENTRIES_STORE = 'entries';
const SETTINGS_STORE = 'settings';
const WEEKLY_REVIEWS_STORE = 'weeklyReviews';
const GOALS_STORE = 'goals';
const REPORTS_STORE = 'reports';
const INSIGHTS_STORE = 'insights';
const REVIEW_CASES_STORE = 'reviewCases';
const PREVIEW_PLANS_STORE = 'previewPlans';
const PRINCIPLES_STORE = 'principles';
const GOAL_PLANS_STORE = 'goalPlans';
const DAILY_GOAL_TARGETS_STORE = 'dailyGoalTargets';
const GOAL_CONFLICTS_STORE = 'goalConflicts';
const WEEKLY_GOAL_REVIEWS_STORE = 'weeklyGoalReviews';
const GOAL_FINAL_REPORTS_STORE = 'goalFinalReports';
const GOAL_PRINCIPLE_EXTRACTIONS_STORE = 'goalPrincipleExtractions';
const GOAL_PREMORTEMS_STORE = 'goalPremortems';
const GOAL_PREMORTEM_REVIEWS_STORE = 'goalPremortemReviews';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
          db.createObjectStore(ENTRIES_STORE, { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        }
        // Version 2: add weeklyReviews store
        if (oldVersion < 2 && !db.objectStoreNames.contains(WEEKLY_REVIEWS_STORE)) {
          db.createObjectStore(WEEKLY_REVIEWS_STORE, { keyPath: 'weekStart' });
        }
        // Version 3: add goals, reports, insights stores
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(GOALS_STORE)) {
            db.createObjectStore(GOALS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(REPORTS_STORE)) {
            db.createObjectStore(REPORTS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(INSIGHTS_STORE)) {
            db.createObjectStore(INSIGHTS_STORE, { keyPath: 'id' });
          }
        }
        // Version 4: add reviewCases, previewPlans, principles stores
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains(REVIEW_CASES_STORE)) {
            db.createObjectStore(REVIEW_CASES_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(PREVIEW_PLANS_STORE)) {
            db.createObjectStore(PREVIEW_PLANS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(PRINCIPLES_STORE)) {
            db.createObjectStore(PRINCIPLES_STORE, { keyPath: 'id' });
          }
        }
        // Version 5: add goal-related stores
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains(GOAL_PLANS_STORE)) {
            const s = db.createObjectStore(GOAL_PLANS_STORE, { keyPath: 'id' });
            s.createIndex('byGoal', 'goalId', { unique: false });
          }
          if (!db.objectStoreNames.contains(DAILY_GOAL_TARGETS_STORE)) {
            const s = db.createObjectStore(DAILY_GOAL_TARGETS_STORE, { keyPath: 'id' });
            s.createIndex('byGoal', 'goalId', { unique: false });
            s.createIndex('byDate', 'date', { unique: false });
          }
          if (!db.objectStoreNames.contains(GOAL_CONFLICTS_STORE)) {
            db.createObjectStore(GOAL_CONFLICTS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(WEEKLY_GOAL_REVIEWS_STORE)) {
            db.createObjectStore(WEEKLY_GOAL_REVIEWS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(GOAL_FINAL_REPORTS_STORE)) {
            db.createObjectStore(GOAL_FINAL_REPORTS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(GOAL_PRINCIPLE_EXTRACTIONS_STORE)) {
            db.createObjectStore(GOAL_PRINCIPLE_EXTRACTIONS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(GOAL_PREMORTEMS_STORE)) {
            db.createObjectStore(GOAL_PREMORTEMS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(GOAL_PREMORTEM_REVIEWS_STORE)) {
            db.createObjectStore(GOAL_PREMORTEM_REVIEWS_STORE, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function loadEntries(): Promise<Entry[]> {
  const db = await getDB();
  const raw = await db.getAll(ENTRIES_STORE);
  return raw.filter((item) => {
    try {
      entrySchema.parse(item);
      return true;
    } catch {
      return false;
    }
  });
}

export async function saveEntry(entry: Entry): Promise<void> {
  const db = await getDB();
  await db.put(ENTRIES_STORE, entry);
}

export async function deleteEntry(dateKey: string): Promise<void> {
  const db = await getDB();
  await db.delete(ENTRIES_STORE, dateKey);
}

const DEFAULT_SETTINGS: Settings = {
  llm: {
    provider: 'openai-compatible',
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  export: {
    folderStructure: 'year-month',
    includeAI: true,
  },
};

export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  const raw = await db.get(SETTINGS_STORE, 'settings');
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return settingsSchema.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put(SETTINGS_STORE, { id: 'settings', ...settings });
}

export async function loadWeeklyReviews(): Promise<Record<string, WeeklyReview>> {
  const db = await getDB();
  const raw = await db.getAll(WEEKLY_REVIEWS_STORE);
  const result: Record<string, WeeklyReview> = {};
  for (const item of raw) {
    try {
      const validated = weeklyReviewSchema.parse(item);
      result[validated.weekStart] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function saveWeeklyReview(review: WeeklyReview): Promise<void> {
  const db = await getDB();
  await db.put(WEEKLY_REVIEWS_STORE, review);
}

// Goals
export async function loadGoals(): Promise<Record<string, Goal>> {
  const db = await getDB();
  const raw = await db.getAll(GOALS_STORE);
  const result: Record<string, Goal> = {};
  for (const item of raw) {
    try {
      const validated = goalSchema.parse(item);
      result[validated.id] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function saveGoal(goal: Goal): Promise<void> {
  const db = await getDB();
  await db.put(GOALS_STORE, goal);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const db = await getDB();
  await db.delete(GOALS_STORE, goalId);
}

// Reports
export async function loadReports(): Promise<Record<string, GeneratedReport>> {
  const db = await getDB();
  const raw = await db.getAll(REPORTS_STORE);
  const result: Record<string, GeneratedReport> = {};
  for (const item of raw) {
    try {
      const validated = generatedReportSchema.parse(item);
      result[validated.id] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function saveReport(report: GeneratedReport): Promise<void> {
  const db = await getDB();
  await db.put(REPORTS_STORE, report);
}

export async function deleteReport(reportId: string): Promise<void> {
  const db = await getDB();
  await db.delete(REPORTS_STORE, reportId);
}

// Insights
export async function loadInsights(): Promise<Record<string, Insight>> {
  const db = await getDB();
  const raw = await db.getAll(INSIGHTS_STORE);
  const result: Record<string, Insight> = {};
  for (const item of raw) {
    try {
      const validated = insightSchema.parse(item);
      result[validated.id] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function saveInsight(insight: Insight): Promise<void> {
  const db = await getDB();
  await db.put(INSIGHTS_STORE, insight);
}

export async function clearInsights(): Promise<void> {
  const db = await getDB();
  await db.clear(INSIGHTS_STORE);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    [ENTRIES_STORE, SETTINGS_STORE, WEEKLY_REVIEWS_STORE, GOALS_STORE, REPORTS_STORE, INSIGHTS_STORE, REVIEW_CASES_STORE, PREVIEW_PLANS_STORE, PRINCIPLES_STORE, GOAL_PLANS_STORE, DAILY_GOAL_TARGETS_STORE, GOAL_CONFLICTS_STORE, WEEKLY_GOAL_REVIEWS_STORE, GOAL_FINAL_REPORTS_STORE, GOAL_PRINCIPLE_EXTRACTIONS_STORE, GOAL_PREMORTEMS_STORE, GOAL_PREMORTEM_REVIEWS_STORE],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore(ENTRIES_STORE).clear(),
    tx.objectStore(SETTINGS_STORE).clear(),
    tx.objectStore(WEEKLY_REVIEWS_STORE).clear(),
    tx.objectStore(GOALS_STORE).clear(),
    tx.objectStore(REPORTS_STORE).clear(),
    tx.objectStore(INSIGHTS_STORE).clear(),
    tx.objectStore(REVIEW_CASES_STORE).clear(),
    tx.objectStore(PREVIEW_PLANS_STORE).clear(),
    tx.objectStore(PRINCIPLES_STORE).clear(),
    tx.objectStore(GOAL_PLANS_STORE).clear(),
    tx.objectStore(DAILY_GOAL_TARGETS_STORE).clear(),
    tx.objectStore(GOAL_CONFLICTS_STORE).clear(),
    tx.objectStore(WEEKLY_GOAL_REVIEWS_STORE).clear(),
    tx.objectStore(GOAL_FINAL_REPORTS_STORE).clear(),
    tx.objectStore(GOAL_PRINCIPLE_EXTRACTIONS_STORE).clear(),
    tx.objectStore(GOAL_PREMORTEMS_STORE).clear(),
    tx.objectStore(GOAL_PREMORTEM_REVIEWS_STORE).clear(),
    tx.done,
  ]);
}

// Review Cases
export async function loadReviewCases(): Promise<Record<string, ReviewCase>> {
  const db = await getDB();
  const raw = await db.getAll(REVIEW_CASES_STORE);
  const result: Record<string, ReviewCase> = {};
  for (const item of raw) {
    try {
      const validated = reviewCaseSchema.parse(item);
      result[validated.id] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function saveReviewCase(reviewCase: ReviewCase): Promise<void> {
  const db = await getDB();
  await db.put(REVIEW_CASES_STORE, reviewCase);
}

export async function deleteReviewCase(reviewCaseId: string): Promise<void> {
  const db = await getDB();
  await db.delete(REVIEW_CASES_STORE, reviewCaseId);
}

// Preview Plans
export async function loadPreviewPlans(): Promise<Record<string, PreviewPlan>> {
  const db = await getDB();
  const raw = await db.getAll(PREVIEW_PLANS_STORE);
  const result: Record<string, PreviewPlan> = {};
  for (const item of raw) {
    try {
      const validated = previewPlanSchema.parse(item);
      result[validated.id] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function savePreviewPlan(previewPlan: PreviewPlan): Promise<void> {
  const db = await getDB();
  await db.put(PREVIEW_PLANS_STORE, previewPlan);
}

export async function deletePreviewPlan(previewPlanId: string): Promise<void> {
  const db = await getDB();
  await db.delete(PREVIEW_PLANS_STORE, previewPlanId);
}

// Principles
export async function loadPrinciples(): Promise<Record<string, Principle>> {
  const db = await getDB();
  const raw = await db.getAll(PRINCIPLES_STORE);
  const result: Record<string, Principle> = {};
  for (const item of raw) {
    try {
      const validated = principleSchema.parse(item);
      result[validated.id] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function savePrinciple(principle: Principle): Promise<void> {
  const db = await getDB();
  await db.put(PRINCIPLES_STORE, principle);
}

export async function deletePrinciple(principleId: string): Promise<void> {
  const db = await getDB();
  await db.delete(PRINCIPLES_STORE, principleId);
}

// Goal Plans
export async function saveGoalPlan(plan: GoalPlan): Promise<void> {
  const db = await getDB();
  await db.put(GOAL_PLANS_STORE, plan);
}
export async function loadGoalPlans(): Promise<GoalPlan[]> {
  const db = await getDB();
  const raw = await db.getAll(GOAL_PLANS_STORE);
  const result: GoalPlan[] = [];
  for (const item of raw) {
    try {
      result.push(goalPlanSchema.parse(item));
    } catch {
      // skip invalid
    }
  }
  return result;
}
export async function deleteGoalPlan(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(GOAL_PLANS_STORE, id);
}

// Daily Goal Targets
export async function saveDailyGoalTarget(target: DailyGoalTarget): Promise<void> {
  const db = await getDB();
  await db.put(DAILY_GOAL_TARGETS_STORE, target);
}
export async function loadDailyGoalTargets(): Promise<DailyGoalTarget[]> {
  const db = await getDB();
  const raw = await db.getAll(DAILY_GOAL_TARGETS_STORE);
  const result: DailyGoalTarget[] = [];
  for (const item of raw) {
    try {
      result.push(dailyGoalTargetSchema.parse(item));
    } catch {
      // skip invalid
    }
  }
  return result;
}
export async function updateDailyGoalTarget(target: DailyGoalTarget): Promise<void> {
  return saveDailyGoalTarget(target);
}
export async function deleteDailyGoalTarget(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DAILY_GOAL_TARGETS_STORE, id);
}

// Goal Conflicts
export async function saveGoalConflict(c: GoalConflict): Promise<void> {
  const db = await getDB();
  await db.put(GOAL_CONFLICTS_STORE, c);
}
export async function loadGoalConflicts(): Promise<GoalConflict[]> {
  const db = await getDB();
  const raw = await db.getAll(GOAL_CONFLICTS_STORE);
  const result: GoalConflict[] = [];
  for (const item of raw) {
    try {
      result.push(goalConflictSchema.parse(item));
    } catch {
      // skip invalid
    }
  }
  return result;
}
export async function deleteGoalConflict(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(GOAL_CONFLICTS_STORE, id);
}

// Weekly Goal Reviews
export async function saveWeeklyGoalReview(r: WeeklyGoalReview): Promise<void> {
  const db = await getDB();
  await db.put(WEEKLY_GOAL_REVIEWS_STORE, r);
}
export async function loadWeeklyGoalReviews(): Promise<WeeklyGoalReview[]> {
  const db = await getDB();
  return db.getAll(WEEKLY_GOAL_REVIEWS_STORE);
}

// Goal Final Reports
export async function saveGoalFinalReport(r: GoalFinalReport): Promise<void> {
  const db = await getDB();
  await db.put(GOAL_FINAL_REPORTS_STORE, r);
}
export async function loadGoalFinalReports(): Promise<GoalFinalReport[]> {
  const db = await getDB();
  return db.getAll(GOAL_FINAL_REPORTS_STORE);
}

// Goal Principle Extractions
export async function saveGoalPrincipleExtraction(p: GoalPrincipleExtraction): Promise<void> {
  const db = await getDB();
  await db.put(GOAL_PRINCIPLE_EXTRACTIONS_STORE, p);
}
export async function loadGoalPrincipleExtractions(): Promise<GoalPrincipleExtraction[]> {
  const db = await getDB();
  return db.getAll(GOAL_PRINCIPLE_EXTRACTIONS_STORE);
}

// Goal Premortems
export async function saveGoalPremortem(p: GoalPremortem): Promise<void> {
  const db = await getDB();
  await db.put(GOAL_PREMORTEMS_STORE, p);
}
export async function loadGoalPremortems(): Promise<GoalPremortem[]> {
  const db = await getDB();
  const raw = await db.getAll(GOAL_PREMORTEMS_STORE);
  const result: GoalPremortem[] = [];
  for (const item of raw) {
    try {
      result.push(goalPremortemSchema.parse(item));
    } catch {
      // skip invalid
    }
  }
  return result;
}

// Goal Premortem Reviews
export async function saveGoalPremortemReview(r: GoalPremortemReview): Promise<void> {
  const db = await getDB();
  await db.put(GOAL_PREMORTEM_REVIEWS_STORE, r);
}
export async function loadGoalPremortemReviews(): Promise<GoalPremortemReview[]> {
  const db = await getDB();
  return db.getAll(GOAL_PREMORTEM_REVIEWS_STORE);
}
