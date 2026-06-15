import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createGoalSlice, type GoalSlice } from '../goalSlice';
import type { Goal, GoalPlan, DailyGoalTarget } from '../../../lib/schema';
import type { GoalDefinitionResult } from '../../../services/goalAI';
import 'fake-indexeddb/auto';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    title: 'Test Goal',
    period: 'week',
    startDate: '2026-06-09',
    endDate: '2026-06-15',
    status: 'active',
    linkedBullets: [],
    createdAt: '2026-06-09T00:00:00.000Z',
    updatedAt: '2026-06-09T00:00:00.000Z',
    ...overrides,
  };
}

function makeGoalPlan(overrides: Partial<GoalPlan> = {}): GoalPlan {
  return {
    id: 'plan-1',
    goalId: 'goal-1',
    summary: 'Test plan summary',
    milestones: [],
    dailyTargets: [],
    generatedBy: 'ai',
    generatedAt: '2026-06-09T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

function makeDailyTarget(overrides: Partial<DailyGoalTarget> = {}): DailyGoalTarget {
  return {
    id: 'target-1',
    goalId: 'goal-1',
    date: '2026-06-10',
    plannedTask: 'Write unit tests',
    minimumStandard: 'At least 3 tests pass',
    expectedOutput: '5 test cases',
    reviewQuestions: ['Did the tests cover edge cases?'],
    status: 'pending',
    createdBy: 'ai',
    createdAt: '2026-06-09T00:00:00.000Z',
    updatedAt: '2026-06-09T00:00:00.000Z',
    ...overrides,
  };
}

describe('goalSlice', () => {
  let store: StoreApi<GoalSlice>;

  beforeEach(() => {
    store = create<GoalSlice>(
      createGoalSlice as StateCreator<GoalSlice, [], [], GoalSlice>
    );
  });

  it('upsertGoal creates a goal', async () => {
    const goal = makeGoal();
    await store.getState().upsertGoal(goal);
    expect(store.getState().goals['goal-1']).toEqual(goal);
  });

  it('upsertGoal updates an existing goal', async () => {
    await store.getState().upsertGoal(makeGoal());
    const updated = makeGoal({ title: 'Updated Goal', status: 'done' });
    await store.getState().upsertGoal(updated);
    expect(store.getState().goals['goal-1']!.title).toBe('Updated Goal');
    expect(store.getState().goals['goal-1']!.status).toBe('done');
  });

  it('deleteGoal removes the goal', async () => {
    await store.getState().upsertGoal(makeGoal());
    expect(store.getState().goals['goal-1']).toBeDefined();
    await store.getState().deleteGoal('goal-1');
    expect(store.getState().goals['goal-1']).toBeUndefined();
  });

  it('deleteGoal does nothing if goal does not exist', async () => {
    await store.getState().deleteGoal('nonexistent');
    expect(store.getState().goals['nonexistent']).toBeUndefined();
  });

  it('linkBulletToGoal adds a bullet ref to the goal', async () => {
    await store.getState().upsertGoal(makeGoal());
    await store.getState().linkBulletToGoal('goal-1', {
      entryId: 'entry-1',
      bulletId: 'bullet-1',
    });
    expect(store.getState().goals['goal-1']!.linkedBullets).toEqual([
      { entryId: 'entry-1', bulletId: 'bullet-1' },
    ]);
  });

  it('linkBulletToGoal deduplicates refs', async () => {
    await store.getState().upsertGoal(makeGoal());
    await store.getState().linkBulletToGoal('goal-1', {
      entryId: 'entry-1',
      bulletId: 'bullet-1',
    });
    await store.getState().linkBulletToGoal('goal-1', {
      entryId: 'entry-1',
      bulletId: 'bullet-1',
    });
    expect(store.getState().goals['goal-1']!.linkedBullets).toHaveLength(1);
  });

  it('linkBulletToGoal does nothing if goal does not exist', async () => {
    await store.getState().linkBulletToGoal('nonexistent', {
      entryId: 'entry-1',
      bulletId: 'bullet-1',
    });
    expect(store.getState().goals['nonexistent']).toBeUndefined();
  });

  it('unlinkBulletFromGoal removes a bullet ref', async () => {
    await store.getState().upsertGoal(
      makeGoal({
        linkedBullets: [
          { entryId: 'entry-1', bulletId: 'bullet-1' },
          { entryId: 'entry-2', bulletId: 'bullet-2' },
        ],
      })
    );
    await store.getState().unlinkBulletFromGoal('goal-1', 'bullet-1');
    expect(store.getState().goals['goal-1']!.linkedBullets).toEqual([
      { entryId: 'entry-2', bulletId: 'bullet-2' },
    ]);
  });

  it('unlinkBulletFromGoal does nothing if goal does not exist', async () => {
    await store.getState().unlinkBulletFromGoal('nonexistent', 'bullet-1');
    expect(store.getState().goals['nonexistent']).toBeUndefined();
  });
});

describe('goalPlans', () => {
  let store: StoreApi<GoalSlice>;

  beforeEach(() => {
    store = create<GoalSlice>(
      createGoalSlice as StateCreator<GoalSlice, [], [], GoalSlice>
    );
  });

  it('addGoalPlan stores plan and persists', async () => {
    const plan = makeGoalPlan();
    store.getState().addGoalPlan(plan);
    expect(store.getState().goalPlans['plan-1']).toEqual(plan);
  });

  it('addGoalPlan overwrites existing plan with same id', () => {
    store.getState().addGoalPlan(makeGoalPlan());
    store.getState().addGoalPlan(makeGoalPlan({ summary: 'Updated plan' }));
    expect(store.getState().goalPlans['plan-1']!.summary).toBe('Updated plan');
  });
});

describe('dailyGoalTargets', () => {
  let store: StoreApi<GoalSlice>;

  beforeEach(() => {
    store = create<GoalSlice>(
      createGoalSlice as StateCreator<GoalSlice, [], [], GoalSlice>
    );
  });

  it('addDailyGoalTarget stores a single target', () => {
    const target = makeDailyTarget();
    store.getState().addDailyGoalTarget(target);
    expect(store.getState().dailyGoalTargets['target-1']).toEqual(target);
  });

  it('addDailyGoalTargets stores multiple targets', () => {
    const t1 = makeDailyTarget({ id: 't-1', date: '2026-06-10' });
    const t2 = makeDailyTarget({ id: 't-2', date: '2026-06-11' });
    const t3 = makeDailyTarget({ id: 't-3', date: '2026-06-12' });
    store.getState().addDailyGoalTargets([t1, t2, t3]);
    expect(store.getState().dailyGoalTargets['t-1']).toEqual(t1);
    expect(store.getState().dailyGoalTargets['t-2']).toEqual(t2);
    expect(store.getState().dailyGoalTargets['t-3']).toEqual(t3);
  });

  it('updateDailyGoalTarget merges patch', () => {
    store.getState().addDailyGoalTarget(makeDailyTarget());
    store.getState().updateDailyGoalTarget('target-1', { status: 'completed', actualProgress: 'Done' });
    const updated = store.getState().dailyGoalTargets['target-1']!;
    expect(updated.status).toBe('completed');
    expect(updated.actualProgress).toBe('Done');
    expect(updated.plannedTask).toBe('Write unit tests'); // unchanged field preserved
  });

  it('updateDailyGoalTarget does nothing if target does not exist', () => {
    store.getState().updateDailyGoalTarget('nonexistent', { status: 'completed' });
    expect(store.getState().dailyGoalTargets['nonexistent']).toBeUndefined();
  });

  it('updateDailyGoalTarget prevents id override', () => {
    store.getState().addDailyGoalTarget(makeDailyTarget());
    store.getState().updateDailyGoalTarget('target-1', { id: 'hacked' } as any);
    expect(store.getState().dailyGoalTargets['target-1']).toBeDefined();
    expect(store.getState().dailyGoalTargets['hacked']).toBeUndefined();
  });

  it('getDailyTargetsByDate returns targets for specific date', () => {
    store.getState().addDailyGoalTargets([
      makeDailyTarget({ id: 't-1', date: '2026-06-10' }),
      makeDailyTarget({ id: 't-2', date: '2026-06-11' }),
      makeDailyTarget({ id: 't-3', date: '2026-06-10' }),
    ]);
    const result = store.getState().getDailyTargetsByDate('2026-06-10');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(['t-1', 't-3']);
  });

  it('getDailyTargetsByDate returns empty array for date with no targets', () => {
    store.getState().addDailyGoalTarget(makeDailyTarget({ date: '2026-06-10' }));
    const result = store.getState().getDailyTargetsByDate('2026-06-15');
    expect(result).toEqual([]);
  });
});

describe('applyGoalDefinitionResult', () => {
  let store: StoreApi<GoalSlice>;

  beforeEach(() => {
    store = create<GoalSlice>(
      createGoalSlice as StateCreator<GoalSlice, [], [], GoalSlice>
    );
  });

  it('updates goal with AI-generated definition', async () => {
    await store.getState().upsertGoal(makeGoal());
    const result: GoalDefinitionResult = {
      successCriteria: ['Criteria 1', 'Criteria 2'],
      constraints: ['Constraint 1'],
      risks: ['Risk 1', 'Risk 2'],
      acceptanceMethod: 'Manual review',
    };
    store.getState().applyGoalDefinitionResult('goal-1', result);
    const updated = store.getState().goals['goal-1']!;
    expect(updated.successCriteria).toEqual(['Criteria 1', 'Criteria 2']);
    expect(updated.constraints).toEqual(['Constraint 1']);
    expect(updated.risks).toEqual(['Risk 1', 'Risk 2']);
    expect(updated.acceptanceMethod).toBe('Manual review');
    expect(updated.title).toBe('Test Goal'); // unchanged fields preserved
  });

  it('does nothing if goal does not exist', () => {
    const result: GoalDefinitionResult = {
      successCriteria: [],
      constraints: [],
      risks: [],
      acceptanceMethod: '',
    };
    store.getState().applyGoalDefinitionResult('nonexistent', result);
    expect(store.getState().goals['nonexistent']).toBeUndefined();
  });
});
