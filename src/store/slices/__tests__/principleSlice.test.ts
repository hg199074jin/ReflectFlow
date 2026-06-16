import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createPrincipleSlice, type PrincipleSlice } from '../principleSlice';
import type { Principle, ReviewCase } from '../../../lib/schema';
import 'fake-indexeddb/auto';

function makePrinciple(overrides: Partial<Principle> = {}): Principle {
  return {
    id: 'principle-1',
    title: 'Test Principle',
    content: 'Always verify assumptions',
    sourceConclusionId: 'conc-1',
    sourceReviewCaseId: 'rc-1',
    evidenceRefs: [],
    applicableContexts: [],
    boundaries: [],
    verificationStatus: 'unverified',
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

function makeReviewCase(overrides: Partial<ReviewCase> = {}): ReviewCase {
  return {
    id: 'rc-1',
    type: 'daily',
    title: 'Test Review Case',
    status: 'completed',
    startDate: '2026-06-09',
    endDate: '2026-06-15',
    linkedGoalIds: [],
    linkedThemeNames: [],
    evidenceRefs: [],
    steps: {
      process: { keyFacts: [], missingFacts: [] },
      expectation: { goals: [], measures: [], assumptions: [] },
      evaluation: { rows: [] },
      causeAnalysis: { whys: [], controllability: [], brightSpots: [] },
      learning: { insights: [], rules: [], boundaries: [] },
    },
    conclusions: [
      {
        id: 'conc-1',
        title: 'Main conclusion',
        content: 'Always double-check data sources',
        evidenceRefs: [],
        quality: {
          score: 80,
          accidentalFactorRisk: 'low',
          pointsToPersonRisk: 'low',
          whyDepth: 3,
          hasCrossValidation: true,
          verdict: 'ready',
        },
        boundary: 'Only applies when data is user-provided',
        reusableAsPrinciple: true,
        createdAt: '2026-06-15T00:00:00.000Z',
      },
    ],
    actionItems: [],
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

type FullState = PrincipleSlice & { reviewCases: Record<string, ReviewCase> };

describe('principleSlice', () => {
  let store: StoreApi<FullState>;

  beforeEach(() => {
    // Compose principleSlice with reviewCases state for promoteConclusionToPrinciple.
    // Cast through unknown because SliceCreator has middleware types that plain create<FullState> lacks.
    store = create<FullState>(
      ((set: any, get: any, api: any) => ({
        reviewCases: {},
        ...createPrincipleSlice(set, get, api),
      })) as unknown as StateCreator<FullState, [], [], FullState>
    );
  });

  it('upsertPrinciple creates a principle', async () => {
    const principle = makePrinciple();
    await store.getState().upsertPrinciple(principle);
    expect(store.getState().principles['principle-1']).toEqual(principle);
  });

  it('upsertPrinciple updates an existing principle', async () => {
    await store.getState().upsertPrinciple(makePrinciple());
    const updated = makePrinciple({ title: 'Updated', verificationStatus: 'testing' });
    await store.getState().upsertPrinciple(updated);
    expect(store.getState().principles['principle-1']!.title).toBe('Updated');
    expect(store.getState().principles['principle-1']!.verificationStatus).toBe('testing');
  });

  it('deletePrinciple removes the principle', async () => {
    await store.getState().upsertPrinciple(makePrinciple());
    expect(store.getState().principles['principle-1']).toBeDefined();
    await store.getState().deletePrinciple('principle-1');
    expect(store.getState().principles['principle-1']).toBeUndefined();
  });

  it('deletePrinciple does nothing if principle does not exist', async () => {
    await store.getState().deletePrinciple('nonexistent');
    expect(store.getState().principles['nonexistent']).toBeUndefined();
  });

  it('promoteConclusionToPrinciple creates a principle from a review case conclusion', async () => {
    // Set up a review case in the store
    store.setState({ reviewCases: { 'rc-1': makeReviewCase() } });

    await store.getState().promoteConclusionToPrinciple('rc-1', 'conc-1');
    const principles = Object.values(store.getState().principles);
    expect(principles).toHaveLength(1);

    const principle = principles[0]!;
    expect(principle.title).toBe('Main conclusion');
    expect(principle.content).toBe('Always double-check data sources');
    expect(principle.sourceConclusionId).toBe('conc-1');
    expect(principle.sourceReviewCaseId).toBe('rc-1');
    expect(principle.boundaries).toEqual(['Only applies when data is user-provided']);
    expect(principle.verificationStatus).toBe('unverified');
    expect(principle.applicableContexts).toEqual([]);
  });

  it('promoteConclusionToPrinciple does nothing if review case does not exist', async () => {
    await store.getState().promoteConclusionToPrinciple('nonexistent', 'conc-1');
    expect(Object.keys(store.getState().principles)).toHaveLength(0);
  });

  it('promoteConclusionToPrinciple does nothing if conclusion does not exist', async () => {
    store.setState({ reviewCases: { 'rc-1': makeReviewCase() } });
    await store.getState().promoteConclusionToPrinciple('rc-1', 'nonexistent-conc');
    expect(Object.keys(store.getState().principles)).toHaveLength(0);
  });
});
