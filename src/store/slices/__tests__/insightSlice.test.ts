import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createInsightSlice, type InsightSlice } from '../insightSlice';
import type { Insight } from '../../../lib/schema';
import 'fake-indexeddb/auto';

function makeInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'insight-1',
    type: 'goal-drift',
    title: 'Test Insight',
    summary: 'Summary text',
    severity: 'info',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-15',
    evidenceRefs: [],
    createdAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('insightSlice', () => {
  let store: StoreApi<InsightSlice>;

  beforeEach(() => {
    store = create<InsightSlice>(
      createInsightSlice as StateCreator<InsightSlice, [], [], InsightSlice>
    );
  });

  it('saveInsights adds insights to state', async () => {
    const insights = [makeInsight(), makeInsight({ id: 'insight-2', title: 'Second' })];
    await store.getState().saveInsights(insights);
    expect(store.getState().insights['insight-1']).toBeDefined();
    expect(store.getState().insights['insight-2']).toBeDefined();
    expect(store.getState().insights['insight-2']!.title).toBe('Second');
  });

  it('saveInsights merges with existing insights', async () => {
    await store.getState().saveInsights([makeInsight()]);
    await store.getState().saveInsights([makeInsight({ id: 'insight-2' })]);
    expect(store.getState().insights['insight-1']).toBeDefined();
    expect(store.getState().insights['insight-2']).toBeDefined();
  });

  it('clearInsights empties the insights state', async () => {
    await store.getState().saveInsights([makeInsight(), makeInsight({ id: 'insight-2' })]);
    expect(Object.keys(store.getState().insights)).toHaveLength(2);
    await store.getState().clearInsights();
    expect(Object.keys(store.getState().insights)).toHaveLength(0);
  });
});
