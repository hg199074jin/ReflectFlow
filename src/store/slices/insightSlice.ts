import type { Insight } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { saveInsight, clearInsights as clearInsightsFromDB } from '../persistence';

export interface InsightSlice {
  insights: Record<string, Insight>;
  saveInsights: (insights: Insight[]) => Promise<void>;
  clearInsights: () => Promise<void>;
}

export const createInsightSlice: SliceCreator<InsightSlice> = (set, get) => ({
  insights: {},

  saveInsights: async (newInsights) => {
    const { insights } = get();
    const updated = { ...insights };
    for (const insight of newInsights) {
      updated[insight.id] = insight;
    }
    set({ insights: updated });
    // Save each insight
    for (const insight of newInsights) {
      await saveInsight(insight);
    }
  },

  clearInsights: async () => {
    set({ insights: {} });
    await clearInsightsFromDB();
  },
});
