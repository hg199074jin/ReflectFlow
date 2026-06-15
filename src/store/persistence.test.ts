import { describe, it, expect, beforeEach } from 'vitest';
import { openDB, deleteDB } from 'idb';
import {
  saveEntry, loadEntries, deleteEntry, saveSettings, loadSettings, clearAllData,
  DB_NAME,
  saveGoalPlan, loadGoalPlans, deleteGoalPlan,
  saveDailyGoalTarget, loadDailyGoalTargets, updateDailyGoalTarget, deleteDailyGoalTarget,
  saveGoalConflict, loadGoalConflicts, deleteGoalConflict,
  saveWeeklyGoalReview, loadWeeklyGoalReviews,
  saveGoalFinalReport, loadGoalFinalReports,
  saveGoalPrincipleExtraction, loadGoalPrincipleExtractions,
  saveGoalPremortem, loadGoalPremortems,
  saveGoalPremortemReview, loadGoalPremortemReviews,
} from './persistence';
import { makeEntry, defaultSettings } from '../test/fixtures';

// Migration test runs before any getDB() call, so the DB is still fresh
describe('IndexedDB migration v4 → v5', () => {
  it('migrates from v4 to v5 with 8 new goal-related stores', async () => {
    // Delete any existing DB to start fresh
    await deleteDB(DB_NAME);

    // Open at v4 with all legacy v1–v4 stores
    const dbV4 = await openDB(DB_NAME, 4, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'date' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('weeklyReviews')) db.createObjectStore('weeklyReviews', { keyPath: 'weekStart' });
        if (!db.objectStoreNames.contains('goals')) db.createObjectStore('goals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('reports')) db.createObjectStore('reports', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('insights')) db.createObjectStore('insights', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('reviewCases')) db.createObjectStore('reviewCases', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('previewPlans')) db.createObjectStore('previewPlans', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('principles')) db.createObjectStore('principles', { keyPath: 'id' });
      },
    });

    // Seed legacy data
    await dbV4.put('goals', {
      id: 'g1',
      title: 'Legacy goal',
      period: 'month',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      status: 'active',
      linkedBullets: [],
      createdAt: '',
      updatedAt: '',
    });
    dbV4.close();

    // Open at v5 — triggers onupgradeneeded
    const dbV5 = await openDB(DB_NAME, 5, {
      upgrade(db, oldVersion) {
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('goalPlans')) {
            const s = db.createObjectStore('goalPlans', { keyPath: 'id' });
            s.createIndex('byGoal', 'goalId', { unique: false });
          }
          if (!db.objectStoreNames.contains('dailyGoalTargets')) {
            const s = db.createObjectStore('dailyGoalTargets', { keyPath: 'id' });
            s.createIndex('byGoal', 'goalId', { unique: false });
            s.createIndex('byDate', 'date', { unique: false });
          }
          if (!db.objectStoreNames.contains('goalConflicts')) db.createObjectStore('goalConflicts', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('weeklyGoalReviews')) db.createObjectStore('weeklyGoalReviews', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('goalFinalReports')) db.createObjectStore('goalFinalReports', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('goalPrincipleExtractions')) db.createObjectStore('goalPrincipleExtractions', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('goalPremortems')) db.createObjectStore('goalPremortems', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('goalPremortemReviews')) db.createObjectStore('goalPremortemReviews', { keyPath: 'id' });
        }
      },
    });

    // All 8 new stores exist
    const newStores = [
      'goalPlans', 'dailyGoalTargets', 'goalConflicts', 'weeklyGoalReviews',
      'goalFinalReports', 'goalPrincipleExtractions', 'goalPremortems', 'goalPremortemReviews',
    ];
    for (const name of newStores) {
      expect(dbV5.objectStoreNames.contains(name)).toBe(true);
    }

    // Legacy data is still readable
    const legacyGoal = await dbV5.get('goals', 'g1');
    expect(legacyGoal.title).toBe('Legacy goal');

    dbV5.close();
  });
});

describe('persistence', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('entries', () => {
    it('saves and loads an entry', async () => {
      const entry = makeEntry();
      await saveEntry(entry);
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]!.id).toBe(entry.id);
      expect(loaded[0]!.date).toBe(entry.date);
    });

    it('saves multiple entries', async () => {
      await saveEntry(makeEntry({ id: 'e1', date: '2026-06-12' }));
      await saveEntry(makeEntry({ id: 'e2', date: '2026-06-13' }));
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(2);
    });

    it('updates existing entry on same date', async () => {
      await saveEntry(makeEntry({ date: '2026-06-13', bullets: { work: [{ id: 'b1', text: 'old' }], study: [], side: [] } }));
      await saveEntry(makeEntry({ date: '2026-06-13', bullets: { work: [{ id: 'b2', text: 'new' }], study: [], side: [] } }));
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]!.bullets.work[0]!.text).toBe('new');
    });

    it('deletes an entry', async () => {
      await saveEntry(makeEntry({ id: 'e1', date: '2026-06-12' }));
      await saveEntry(makeEntry({ id: 'e2', date: '2026-06-13' }));
      await deleteEntry('2026-06-12');
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]!.date).toBe('2026-06-13');
    });

    it('returns empty array for empty DB', async () => {
      const loaded = await loadEntries();
      expect(loaded).toEqual([]);
    });
  });

  describe('settings', () => {
    it('saves and loads settings', async () => {
      await saveSettings(defaultSettings);
      const loaded = await loadSettings();
      expect(loaded.llm.provider).toBe('openai-compatible');
      expect(loaded.llm.model).toBe('gpt-4o-mini');
      expect(loaded.export.folderStructure).toBe('year-month');
    });

    it('returns default settings when empty', async () => {
      const loaded = await loadSettings();
      expect(loaded.llm.provider).toBe('openai-compatible');
      expect(loaded.llm.model).toBe('gpt-4o-mini');
      expect(loaded.llm.baseUrl).toBe('https://api.openai.com/v1');
    });
  });

  describe('clearAllData', () => {
    it('removes all entries and settings', async () => {
      await saveEntry(makeEntry());
      await saveSettings(defaultSettings);
      await clearAllData();
      const entries = await loadEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('goal-related stores', () => {
    it('round-trips goalPlan through IndexedDB', async () => {
      const plan = {
        id: 'p1', goalId: 'g1', summary: 'test plan', milestones: [], dailyTargets: [],
        generatedBy: 'ai' as const, generatedAt: '2026-06-15T00:00:00Z', version: 1,
      };
      await saveGoalPlan(plan);
      const loaded = await loadGoalPlans();
      expect(loaded.find(p => p.id === 'p1')).toEqual(plan);
    });

    it('deletes a goalPlan', async () => {
      const plan = {
        id: 'p1', goalId: 'g1', summary: 's', milestones: [], dailyTargets: [],
        generatedBy: 'ai' as const, generatedAt: '', version: 1,
      };
      await saveGoalPlan(plan);
      await deleteGoalPlan('p1');
      expect(await loadGoalPlans()).toEqual([]);
    });

    it('round-trips dailyGoalTarget through IndexedDB', async () => {
      const target = {
        id: 't1', goalId: 'g1', date: '2026-06-15', plannedTask: 'task',
        minimumStandard: 'min', expectedOutput: 'out', reviewQuestions: ['q1'],
        status: 'pending' as const, createdBy: 'ai' as const,
        createdAt: '', updatedAt: '',
      };
      await saveDailyGoalTarget(target);
      const loaded = await loadDailyGoalTargets();
      expect(loaded.find(t => t.id === 't1')).toEqual(target);
    });

    it('updateDailyGoalTarget overwrites existing target', async () => {
      const target = {
        id: 't1', goalId: 'g1', date: '2026-06-15', plannedTask: 'old',
        minimumStandard: 'min', expectedOutput: 'out', reviewQuestions: [],
        status: 'pending' as const, createdBy: 'ai' as const,
        createdAt: '', updatedAt: '',
      };
      await saveDailyGoalTarget(target);
      await updateDailyGoalTarget({ ...target, plannedTask: 'new' });
      const loaded = await loadDailyGoalTargets();
      expect(loaded.find(t => t.id === 't1')!.plannedTask).toBe('new');
    });

    it('deletes a dailyGoalTarget', async () => {
      const target = {
        id: 't1', goalId: 'g1', date: '2026-06-15', plannedTask: 'task',
        minimumStandard: 'min', expectedOutput: 'out', reviewQuestions: [],
        status: 'pending' as const, createdBy: 'ai' as const,
        createdAt: '', updatedAt: '',
      };
      await saveDailyGoalTarget(target);
      await deleteDailyGoalTarget('t1');
      expect(await loadDailyGoalTargets()).toEqual([]);
    });

    it('round-trips goalConflict through IndexedDB', async () => {
      const conflict = {
        id: 'c1', goalIds: ['g1', 'g2'], type: 'time_conflict' as const,
        severity: 'low' as const, description: 'desc', evidence: [],
        suggestion: 'sug', createdAt: '',
      };
      await saveGoalConflict(conflict);
      const loaded = await loadGoalConflicts();
      expect(loaded.find(c => c.id === 'c1')).toEqual(conflict);
    });

    it('deletes a goalConflict', async () => {
      await saveGoalConflict({
        id: 'c1', goalIds: [], type: 'time_conflict' as const,
        severity: 'low' as const, description: '', evidence: [],
        suggestion: '', createdAt: '',
      });
      await deleteGoalConflict('c1');
      expect(await loadGoalConflicts()).toEqual([]);
    });

    it('round-trips weeklyGoalReview through IndexedDB', async () => {
      const review = {
        id: 'wr1', weekStart: '2026-06-09', weekEnd: '2026-06-15',
        goalIds: [], completionSummary: 'ok', completedTargets: 3,
        missedTargets: 1, adjustedTargets: 0, mainDeviations: [],
        recurringBlockers: [], effectiveActions: [], ineffectiveActions: [],
        nextWeekSuggestions: [], goalsToPrioritize: [], goalsToPause: [],
        createdAt: '',
      };
      await saveWeeklyGoalReview(review);
      const loaded = await loadWeeklyGoalReviews();
      expect(loaded.find(r => r.id === 'wr1')).toEqual(review);
    });

    it('round-trips goalFinalReport through IndexedDB', async () => {
      const report = {
        id: 'fr1', goalId: 'g1', title: 'Final',
        period: { startDate: '2026-01-01', endDate: '2026-02-01' },
        originalGoal: 'goal', successCriteria: [], finalOutcome: 'done',
        completionLevel: 'completed' as const, keyActions: [],
        majorDeviations: [], rootCauses: [], adjustments: [],
        effectiveActions: [], ineffectiveActions: [], principles: [],
        nextTimeSuggestions: [], markdown: '# report', createdAt: '',
      };
      await saveGoalFinalReport(report);
      const loaded = await loadGoalFinalReports();
      expect(loaded.find(r => r.id === 'fr1')).toEqual(report);
    });

    it('round-trips goalPrincipleExtraction through IndexedDB', async () => {
      const extraction = {
        id: 'pe1', goalId: 'g1', principleTitle: 'Title',
        principleContent: 'Content', sourceEvidence: [],
        applicableScenarios: [], boundaryConditions: [],
        counterExamples: [], confidence: 'medium' as const, createdAt: '',
      };
      await saveGoalPrincipleExtraction(extraction);
      const loaded = await loadGoalPrincipleExtractions();
      expect(loaded.find(p => p.id === 'pe1')).toEqual(extraction);
    });

    it('round-trips goalPremortem through IndexedDB', async () => {
      const premortem = {
        id: 'pm1', goalId: 'g1', predictedFailureReasons: [],
        underestimatedConstraints: [], likelyDelays: [],
        triggerConditions: [], minimumViablePath: 'path', createdAt: '',
      };
      await saveGoalPremortem(premortem);
      const loaded = await loadGoalPremortems();
      expect(loaded.find(p => p.id === 'pm1')).toEqual(premortem);
    });

    it('round-trips goalPremortemReview through IndexedDB', async () => {
      const review = {
        id: 'pmr1', goalId: 'g1', premortemId: 'pm1',
        accuratePredictions: [], inaccuratePredictions: [],
        missedRisks: [], judgmentLessons: [], createdAt: '',
      };
      await saveGoalPremortemReview(review);
      const loaded = await loadGoalPremortemReviews();
      expect(loaded.find(r => r.id === 'pmr1')).toEqual(review);
    });

    it('clearAllData wipes new stores', async () => {
      await saveGoalConflict({
        id: 'c1', goalIds: [], type: 'time_conflict' as const,
        severity: 'low' as const, description: '', evidence: [],
        suggestion: '', createdAt: '',
      });
      await clearAllData();
      expect(await loadGoalConflicts()).toEqual([]);
    });
  });
});
