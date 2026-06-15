import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createGoalSlice, type GoalSlice } from '../goalSlice';
import type { Goal } from '../../../lib/schema';
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
