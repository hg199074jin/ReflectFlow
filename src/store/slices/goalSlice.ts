import type { Goal } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { saveGoal, deleteGoal as deleteGoalFromDB } from '../persistence';

export interface GoalSlice {
  goals: Record<string, Goal>;
  upsertGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  linkBulletToGoal: (goalId: string, ref: { entryId: string; bulletId: string }) => Promise<void>;
  unlinkBulletFromGoal: (goalId: string, bulletId: string) => Promise<void>;
}

export const createGoalSlice: SliceCreator<GoalSlice> = (set, get) => ({
  goals: {},

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
});
