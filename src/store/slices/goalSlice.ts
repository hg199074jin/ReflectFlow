import type { Goal, GoalPlan, DailyGoalTarget, GoalFinalReport, GoalPrincipleExtraction, GoalPremortem } from '../../lib/schema';
import type { GoalDefinitionResult } from '../../services/goalAI';
import type { SliceCreator } from './sliceTypes';
import {
  saveGoal, deleteGoal as deleteGoalFromDB,
  saveGoalPlan, saveDailyGoalTarget, updateDailyGoalTarget as updateDailyGoalTargetDB,
  saveGoalFinalReport, saveGoalPrincipleExtraction,
  saveGoalPremortem as saveGoalPremortemDB,
} from '../persistence';

export interface GoalSlice {
  // existing
  goals: Record<string, Goal>;
  upsertGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  linkBulletToGoal: (goalId: string, ref: { entryId: string; bulletId: string }) => Promise<void>;
  unlinkBulletFromGoal: (goalId: string, bulletId: string) => Promise<void>;

  // new state
  goalPlans: Record<string, GoalPlan>;
  dailyGoalTargets: Record<string, DailyGoalTarget>;
  goalFinalReports: Record<string, GoalFinalReport>;
  goalPrincipleExtractions: Record<string, GoalPrincipleExtraction>;
  goalPremortems: Record<string, GoalPremortem>;

  // new actions
  addGoalPlan: (plan: GoalPlan) => void;
  addDailyGoalTarget: (target: DailyGoalTarget) => void;
  addDailyGoalTargets: (targets: DailyGoalTarget[]) => void;
  updateDailyGoalTarget: (id: string, patch: Partial<DailyGoalTarget>) => void;
  getDailyTargetsByDate: (date: string) => DailyGoalTarget[];
  applyGoalDefinitionResult: (goalId: string, result: GoalDefinitionResult) => void;
  upsertGoalFinalReport: (report: GoalFinalReport) => void;
  upsertGoalPrincipleExtraction: (extraction: GoalPrincipleExtraction) => void;
  upsertGoalPremortem: (premortem: GoalPremortem) => void;
}

export const createGoalSlice: SliceCreator<GoalSlice> = (set, get) => ({
  goals: {},
  goalPlans: {},
  dailyGoalTargets: {},
  goalFinalReports: {},
  goalPrincipleExtractions: {},
  goalPremortems: {},

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

  // --- Goal Plans ---

  addGoalPlan: (plan) => {
    const { goalPlans } = get();
    set({ goalPlans: { ...goalPlans, [plan.id]: plan } });
    saveGoalPlan(plan);
  },

  // --- Daily Goal Targets ---

  addDailyGoalTarget: (target) => {
    const { dailyGoalTargets } = get();
    set({ dailyGoalTargets: { ...dailyGoalTargets, [target.id]: target } });
    saveDailyGoalTarget(target);
  },

  addDailyGoalTargets: (targets) => {
    const { dailyGoalTargets } = get();
    const updated = { ...dailyGoalTargets };
    for (const t of targets) {
      updated[t.id] = t;
      saveDailyGoalTarget(t);
    }
    set({ dailyGoalTargets: updated });
  },

  updateDailyGoalTarget: (id, patch) => {
    const { dailyGoalTargets } = get();
    const existing = dailyGoalTargets[id];
    if (!existing) return;

    const merged: DailyGoalTarget = {
      ...existing,
      ...patch,
      id: existing.id, // prevent id override
      updatedAt: new Date().toISOString(),
    };
    set({ dailyGoalTargets: { ...dailyGoalTargets, [id]: merged } });
    updateDailyGoalTargetDB(merged);
  },

  getDailyTargetsByDate: (date) => {
    const { dailyGoalTargets } = get();
    return Object.values(dailyGoalTargets).filter((t) => t.date === date);
  },

  // --- AI Definition ---

  applyGoalDefinitionResult: (goalId, result) => {
    const { goals } = get();
    const goal = goals[goalId];
    if (!goal) return;

    const updated: Goal = {
      ...goal,
      successCriteria: result.successCriteria,
      constraints: result.constraints,
      risks: result.risks,
      acceptanceMethod: result.acceptanceMethod,
      updatedAt: new Date().toISOString(),
    };
    set({ goals: { ...goals, [goalId]: updated } });
    saveGoal(updated);
  },

  // --- Goal Final Reports ---

  upsertGoalFinalReport: (report) => {
    const { goalFinalReports } = get();
    set({ goalFinalReports: { ...goalFinalReports, [report.id]: report } });
    saveGoalFinalReport(report);
  },

  // --- Goal Principle Extractions ---

  upsertGoalPrincipleExtraction: (extraction) => {
    const { goalPrincipleExtractions } = get();
    set({ goalPrincipleExtractions: { ...goalPrincipleExtractions, [extraction.id]: extraction } });
    saveGoalPrincipleExtraction(extraction);
  },

  // --- Goal Premortems ---

  upsertGoalPremortem: (premortem) => {
    const { goalPremortems } = get();
    set({ goalPremortems: { ...goalPremortems, [premortem.id]: premortem } });
    saveGoalPremortemDB(premortem);
  },
});
