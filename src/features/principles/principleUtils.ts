import { createId } from '../../lib/ids';
import type { Principle, ReviewCase, ReviewConclusion } from '../../lib/schema';

/**
 * Check if a conclusion can be promoted to a principle
 */
export function canPromoteConclusion(conclusion: ReviewConclusion): boolean {
  // Only promote if quality verdict is 'ready' or user has manually confirmed
  return conclusion.reusableAsPrinciple;
}

/**
 * Create a principle from a review conclusion
 */
export function createPrincipleFromConclusion(
  reviewCase: ReviewCase,
  conclusion: ReviewConclusion
): Principle {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: conclusion.title,
    content: conclusion.content,
    sourceConclusionId: conclusion.id,
    sourceReviewCaseId: reviewCase.id,
    evidenceRefs: conclusion.evidenceRefs,
    applicableContexts: [],
    boundaries: conclusion.boundary ? [conclusion.boundary] : [],
    verificationStatus: 'unverified',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Filter principles by verification status
 */
export function filterPrinciples(
  principles: Principle[],
  filters: {
    verificationStatus?: Principle['verificationStatus'];
    searchQuery?: string;
  }
): Principle[] {
  let filtered = principles;

  if (filters.verificationStatus) {
    filtered = filtered.filter((p) => p.verificationStatus === filters.verificationStatus);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.applicableContexts.some((c) => c.toLowerCase().includes(query))
    );
  }

  return filtered;
}

/**
 * Get principle statistics
 */
export function getPrincipleStats(principles: Principle[]): {
  total: number;
  byStatus: Record<Principle['verificationStatus'], number>;
} {
  const byStatus: Record<Principle['verificationStatus'], number> = {
    unverified: 0,
    testing: 0,
    validated: 0,
    invalidated: 0,
  };

  for (const principle of principles) {
    byStatus[principle.verificationStatus]++;
  }

  return {
    total: principles.length,
    byStatus,
  };
}

/**
 * Update principle verification status
 */
export function updatePrincipleVerificationStatus(
  principle: Principle,
  newStatus: Principle['verificationStatus']
): Principle {
  return {
    ...principle,
    verificationStatus: newStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add applicable context to principle
 */
export function addApplicableContext(
  principle: Principle,
  context: string
): Principle {
  if (principle.applicableContexts.includes(context)) {
    return principle;
  }

  return {
    ...principle,
    applicableContexts: [...principle.applicableContexts, context],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove applicable context from principle
 */
export function removeApplicableContext(
  principle: Principle,
  context: string
): Principle {
  return {
    ...principle,
    applicableContexts: principle.applicableContexts.filter((c) => c !== context),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add boundary to principle
 */
export function addBoundary(
  principle: Principle,
  boundary: string
): Principle {
  if (principle.boundaries.includes(boundary)) {
    return principle;
  }

  return {
    ...principle,
    boundaries: [...principle.boundaries, boundary],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove boundary from principle
 */
export function removeBoundary(
  principle: Principle,
  boundary: string
): Principle {
  return {
    ...principle,
    boundaries: principle.boundaries.filter((b) => b !== boundary),
    updatedAt: new Date().toISOString(),
  };
}
