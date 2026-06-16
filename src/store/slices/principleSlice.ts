import type { Principle, ReviewCase } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { createId } from '../../lib/ids';
import { savePrinciple, deletePrinciple as deletePrincipleFromDB } from '../persistence';

export interface PrincipleSlice {
  principles: Record<string, Principle>;
  upsertPrinciple: (principle: Principle) => Promise<void>;
  deletePrinciple: (principleId: string) => Promise<void>;
  promoteConclusionToPrinciple: (reviewCaseId: string, conclusionId: string) => Promise<void>;
}

export const createPrincipleSlice: SliceCreator<PrincipleSlice> = (set, get) => ({
  principles: {},

  upsertPrinciple: async (principle) => {
    const { principles } = get();
    set({ principles: { ...principles, [principle.id]: principle } });
    await savePrinciple(principle);
  },

  deletePrinciple: async (principleId) => {
    const { principles } = get();
    const { [principleId]: _, ...rest } = principles;
    set({ principles: rest });
    await deletePrincipleFromDB(principleId);
  },

  promoteConclusionToPrinciple: async (reviewCaseId, conclusionId) => {
    const { principles } = get();
    // At runtime get() returns the full composed store state (including reviewCases),
    // but the SliceCreator type only knows about PrincipleSlice. Use a type assertion
    // to access cross-slice state — this is the standard Zustand sliced-store pattern.
    const allState = get() as PrincipleSlice & { reviewCases: Record<string, ReviewCase> };
    const reviewCase = allState.reviewCases[reviewCaseId];
    if (!reviewCase) return;

    const conclusion = reviewCase.conclusions.find((c) => c.id === conclusionId);
    if (!conclusion) return;

    const now = new Date().toISOString();
    const principle: Principle = {
      id: createId(),
      title: conclusion.title,
      content: conclusion.content,
      sourceConclusionId: conclusionId,
      sourceReviewCaseId: reviewCaseId,
      evidenceRefs: conclusion.evidenceRefs,
      applicableContexts: [],
      boundaries: conclusion.boundary ? [conclusion.boundary] : [],
      verificationStatus: 'unverified',
      createdAt: now,
      updatedAt: now,
    };

    set({ principles: { ...principles, [principle.id]: principle } });
    await savePrinciple(principle);
  },
});
