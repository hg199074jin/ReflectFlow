import type { WeeklyReview, ReviewCase } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { saveWeeklyReview, saveReviewCase, deleteReviewCase as deleteReviewCaseFromDB } from '../persistence';

export interface ReviewSlice {
  weeklyReviews: Record<string, WeeklyReview>;
  reviewCases: Record<string, ReviewCase>;
  updateWeeklyReview: (weekStart: string, review: Partial<WeeklyReview>) => void;
  upsertReviewCase: (reviewCase: ReviewCase) => Promise<void>;
  deleteReviewCase: (reviewCaseId: string) => Promise<void>;
}

export const createReviewSlice: SliceCreator<ReviewSlice> = (set, get) => ({
  weeklyReviews: {},
  reviewCases: {},

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

  upsertReviewCase: async (reviewCase) => {
    const { reviewCases } = get();
    set({ reviewCases: { ...reviewCases, [reviewCase.id]: reviewCase } });
    await saveReviewCase(reviewCase);
  },

  deleteReviewCase: async (reviewCaseId) => {
    const { reviewCases } = get();
    const { [reviewCaseId]: _, ...rest } = reviewCases;
    set({ reviewCases: rest });
    await deleteReviewCaseFromDB(reviewCaseId);
  },
});
