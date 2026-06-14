import { createId } from '../../lib/ids';
import type { PreviewPlan, ReviewSteps } from '../../lib/schema';

/**
 * Create an empty preview plan
 */
export function createEmptyPreviewPlan(input: {
  title: string;
  startDate: string;
  endDate: string;
}): PreviewPlan {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: input.title,
    purpose: '',
    goals: [],
    strategies: [],
    assumptions: [],
    risks: [],
    contingencies: [],
    linkedGoalIds: [],
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Build expectation from preview plan
 * Converts preview plan into review expectation step data
 */
export function buildExpectationFromPreviewPlan(
  plan: PreviewPlan
): ReviewSteps['expectation'] {
  return {
    purpose: plan.purpose,
    goals: plan.goals,
    measures: plan.strategies,
    assumptions: plan.assumptions,
  };
}

/**
 * Compare preview plan with review case
 * Returns deviation rows showing plan vs actual
 */
export function comparePreviewWithReview(
  plan: PreviewPlan,
  reviewExpectation: ReviewSteps['expectation']
): Array<{
  level: 'purpose' | 'goal' | 'measure';
  planned: string;
  actual: string;
  deviation: string;
}> {
  const deviations: Array<{
    level: 'purpose' | 'goal' | 'measure';
    planned: string;
    actual: string;
    deviation: string;
  }> = [];

  // Compare purpose
  if (plan.purpose && reviewExpectation.purpose) {
    deviations.push({
      level: 'purpose',
      planned: plan.purpose,
      actual: reviewExpectation.purpose,
      deviation: plan.purpose === reviewExpectation.purpose ? '一致' : '有调整',
    });
  }

  // Compare goals
  const maxGoals = Math.max(plan.goals.length, reviewExpectation.goals.length);
  for (let i = 0; i < maxGoals; i++) {
    const planned = plan.goals[i] || '（未规划）';
    const actual = reviewExpectation.goals[i] || '（未设定）';
    deviations.push({
      level: 'goal',
      planned,
      actual,
      deviation: planned === actual ? '一致' : '有调整',
    });
  }

  // Compare strategies/measures
  const maxMeasures = Math.max(plan.strategies.length, reviewExpectation.measures.length);
  for (let i = 0; i < maxMeasures; i++) {
    const planned = plan.strategies[i] || '（未规划）';
    const actual = reviewExpectation.measures[i] || '（未设定）';
    deviations.push({
      level: 'measure',
      planned,
      actual,
      deviation: planned === actual ? '一致' : '有调整',
    });
  }

  return deviations;
}

/**
 * Get preview plan completion status
 */
export function getPreviewPlanCompletion(plan: PreviewPlan): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = 6; // Main sections
  let completed = 0;

  if (plan.purpose.trim()) completed++;
  if (plan.goals.length > 0) completed++;
  if (plan.strategies.length > 0) completed++;
  if (plan.assumptions.length > 0) completed++;
  if (plan.risks.length > 0) completed++;
  if (plan.contingencies.length > 0) completed++;

  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
  };
}
