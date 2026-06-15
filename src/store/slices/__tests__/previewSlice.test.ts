import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createPreviewSlice, type PreviewSlice } from '../previewSlice';
import type { PreviewPlan } from '../../../lib/schema';
import 'fake-indexeddb/auto';

function makePreviewPlan(overrides: Partial<PreviewPlan> = {}): PreviewPlan {
  return {
    id: 'preview-1',
    title: 'Test Preview Plan',
    purpose: 'Plan for next week',
    goals: ['Goal 1'],
    strategies: ['Strategy 1'],
    assumptions: ['Assumption 1'],
    risks: ['Risk 1'],
    contingencies: ['Contingency 1'],
    linkedGoalIds: [],
    startDate: '2026-06-16',
    endDate: '2026-06-22',
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('previewSlice', () => {
  let store: StoreApi<PreviewSlice>;

  beforeEach(() => {
    store = create<PreviewSlice>(
      createPreviewSlice as StateCreator<PreviewSlice, [], [], PreviewSlice>
    );
  });

  it('upsertPreviewPlan creates a preview plan', async () => {
    const plan = makePreviewPlan();
    await store.getState().upsertPreviewPlan(plan);
    expect(store.getState().previewPlans['preview-1']).toEqual(plan);
  });

  it('upsertPreviewPlan updates an existing preview plan', async () => {
    await store.getState().upsertPreviewPlan(makePreviewPlan());
    const updated = makePreviewPlan({ title: 'Updated Plan', risks: ['New risk'] });
    await store.getState().upsertPreviewPlan(updated);
    expect(store.getState().previewPlans['preview-1']!.title).toBe('Updated Plan');
    expect(store.getState().previewPlans['preview-1']!.risks).toEqual(['New risk']);
  });

  it('deletePreviewPlan removes the preview plan', async () => {
    await store.getState().upsertPreviewPlan(makePreviewPlan());
    expect(store.getState().previewPlans['preview-1']).toBeDefined();
    await store.getState().deletePreviewPlan('preview-1');
    expect(store.getState().previewPlans['preview-1']).toBeUndefined();
  });

  it('deletePreviewPlan does nothing if plan does not exist', async () => {
    await store.getState().deletePreviewPlan('nonexistent');
    expect(store.getState().previewPlans['nonexistent']).toBeUndefined();
  });
});
