import type { WeeklyReview } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { saveWeeklyReview } from '../persistence';

export interface ReviewSlice {
  weeklyReviews: Record<string, WeeklyReview>;
  updateWeeklyReview: (weekStart: string, review: Partial<WeeklyReview>) => void;
}

export const createReviewSlice: SliceCreator<ReviewSlice> = (set, get) => ({
  weeklyReviews: {},

  updateWeeklyReview: (weekStart, review) => {
    const { weeklyReviews } = get();
    const existing = weeklyReviews[weekStart];

    const updated: WeeklyReview = existing
      ? { ...existing, ...review, weekStart }
      : { weekStart, ...review };

    const newWeeklyReviews = { ...weeklyReviews, [weekStart]: updated };
    set({ weeklyReviews: newWeeklyReviews });
    saveWeeklyReview(updated);
  },
});
