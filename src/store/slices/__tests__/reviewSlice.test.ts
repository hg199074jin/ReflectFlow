import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createReviewSlice, type ReviewSlice } from '../reviewSlice';
import 'fake-indexeddb/auto';

describe('reviewSlice', () => {
  let store: StoreApi<ReviewSlice>;

  beforeEach(() => {
    store = create<ReviewSlice>(
      createReviewSlice as StateCreator<ReviewSlice, [], [], ReviewSlice>
    );
  });

  it('updateWeeklyReview creates a new weekly review', () => {
    store.getState().updateWeeklyReview('2026-06-09', { target: 'test target' });
    const review = store.getState().weeklyReviews['2026-06-09'];
    expect(review).toBeDefined();
    expect(review!.weekStart).toBe('2026-06-09');
    expect(review!.target).toBe('test target');
  });

  it('updateWeeklyReview merges with existing review', () => {
    store.getState().updateWeeklyReview('2026-06-09', { target: 'target' });
    store.getState().updateWeeklyReview('2026-06-09', { completed: 'done stuff' });
    const review = store.getState().weeklyReviews['2026-06-09'];
    expect(review!.target).toBe('target');
    expect(review!.completed).toBe('done stuff');
  });

  it('updateWeeklyReview preserves weekStart when merging', () => {
    store.getState().updateWeeklyReview('2026-06-09', { target: 'target' });
    store.getState().updateWeeklyReview('2026-06-09', { pattern: 'some pattern' });
    const review = store.getState().weeklyReviews['2026-06-09'];
    expect(review!.weekStart).toBe('2026-06-09');
    expect(review!.pattern).toBe('some pattern');
  });

  it('updateWeeklyReview supports multiple weeks independently', () => {
    store.getState().updateWeeklyReview('2026-06-02', { target: 'week1' });
    store.getState().updateWeeklyReview('2026-06-09', { target: 'week2' });
    expect(store.getState().weeklyReviews['2026-06-02']!.target).toBe('week1');
    expect(store.getState().weeklyReviews['2026-06-09']!.target).toBe('week2');
  });
});
