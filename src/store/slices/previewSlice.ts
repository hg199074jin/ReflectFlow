import type { PreviewPlan } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { savePreviewPlan, deletePreviewPlan as deletePreviewPlanFromDB } from '../persistence';

export interface PreviewSlice {
  previewPlans: Record<string, PreviewPlan>;
  upsertPreviewPlan: (previewPlan: PreviewPlan) => Promise<void>;
  deletePreviewPlan: (previewPlanId: string) => Promise<void>;
}

export const createPreviewSlice: SliceCreator<PreviewSlice> = (set, get) => ({
  previewPlans: {},

  upsertPreviewPlan: async (previewPlan) => {
    const { previewPlans } = get();
    set({ previewPlans: { ...previewPlans, [previewPlan.id]: previewPlan } });
    await savePreviewPlan(previewPlan);
  },

  deletePreviewPlan: async (previewPlanId) => {
    const { previewPlans } = get();
    const { [previewPlanId]: _, ...rest } = previewPlans;
    set({ previewPlans: rest });
    await deletePreviewPlanFromDB(previewPlanId);
  },
});
