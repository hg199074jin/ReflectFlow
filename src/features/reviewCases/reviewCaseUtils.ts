import { createId } from '../../lib/ids';
import type {
  ReviewCase, ReviewCaseType, ReviewSteps,
  EvidenceRef, DeviationRow,
} from '../../lib/schema';
import type { Entry, Goal } from '../../lib/schema';

/**
 * Build evidence refs for a date range from entries
 */
export function buildReviewEvidence(input: {
  entries: Entry[];
  startDate: string;
  endDate: string;
}): EvidenceRef[] {
  const { entries, startDate, endDate } = input;
  const refs: EvidenceRef[] = [];

  for (const entry of entries) {
    if (entry.date < startDate || entry.date > endDate) continue;

    for (const [category, bullets] of Object.entries(entry.bullets)) {
      for (const bullet of bullets) {
        refs.push({
          entryId: entry.id,
          date: entry.date,
          category: category as 'work' | 'study' | 'side',
          bulletId: bullet.id,
          text: bullet.text,
        });
      }
    }
  }

  // Sort by date ascending
  return refs.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build evidence refs for linked goals
 */
export function buildGoalEvidence(input: {
  entries: Entry[];
  goals: Goal[];
}): EvidenceRef[] {
  const { entries, goals } = input;
  const refs: EvidenceRef[] = [];
  const bulletIds = new Set<string>();

  // Collect all linked bullet IDs from goals
  for (const goal of goals) {
    for (const ref of goal.linkedBullets) {
      bulletIds.add(`${ref.entryId}:${ref.bulletId}`);
    }
  }

  // Find matching bullets in entries
  for (const entry of entries) {
    for (const [category, bullets] of Object.entries(entry.bullets)) {
      for (const bullet of bullets) {
        if (bulletIds.has(`${entry.id}:${bullet.id}`)) {
          refs.push({
            entryId: entry.id,
            date: entry.date,
            category: category as 'work' | 'study' | 'side',
            bulletId: bullet.id,
            text: bullet.text,
          });
        }
      }
    }
  }

  return refs.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Group evidence by date
 */
export function groupEvidenceByDate(
  evidenceRefs: EvidenceRef[]
): Array<{ date: string; refs: EvidenceRef[] }> {
  const groups = new Map<string, EvidenceRef[]>();

  for (const ref of evidenceRefs) {
    const existing = groups.get(ref.date) || [];
    existing.push(ref);
    groups.set(ref.date, existing);
  }

  return Array.from(groups.entries())
    .map(([date, refs]) => ({ date, refs }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Create a review case pre-populated from existing daily review data
 */
export function createReviewCaseFromEntries(input: {
  type: ReviewCaseType;
  title: string;
  startDate: string;
  endDate: string;
  entries: Entry[];
}): ReviewCase {
  const { type, title, startDate, endDate, entries } = input;
  const now = new Date().toISOString();

  // Filter entries in the date range
  const periodEntries = entries.filter(
    (e) => e.date >= startDate && e.date <= endDate && e.review
  );

  // Collect daily review data
  const targets: string[] = [];
  const gaps: string[] = [];
  const reasons: string[] = [];
  const whatIfs: string[] = [];
  const lessons: string[] = [];

  for (const entry of periodEntries) {
    if (entry.review?.target) targets.push(`[${entry.date}] ${entry.review.target}`);
    if (entry.review?.gap) gaps.push(`[${entry.date}] ${entry.review.gap}`);
    if (entry.review?.reason) reasons.push(`[${entry.date}] ${entry.review.reason}`);
    if (entry.review?.whatIf) whatIfs.push(`[${entry.date}] ${entry.review.whatIf}`);
    if (entry.review?.lesson) lessons.push(`[${entry.date}] ${entry.review.lesson}`);
  }

  // Pre-populate expectation step from daily targets
  const goals = targets.length > 0 ? targets : [];
  const purpose = targets.length > 0
    ? `基于 ${periodEntries.length} 天的每日目标记录`
    : '';

  // Pre-populate evaluation rows from daily gaps
  const evalRows: DeviationRow[] = gaps.map((gap) => createDeviationRow({
    level: 'goal',
    expectation: '',
    result: gap,
    deviation: '',
    status: 'unclear',
  }));

  // Pre-populate cause analysis from daily reasons and whatIfs
  const whyChains = reasons.map((reason, i) => ({
    id: createId(),
    question: `为什么？`,
    answer: reason,
    depth: i + 1,
    parentId: i > 0 ? createId() : undefined,
  }));

  // Pre-populate learning from daily lessons
  const insights = lessons.map((l) => l.replace(/^\[\d{4}-\d{2}-\d{2}\]\s*/, ''));

  const steps: ReviewSteps = {
    process: {
      timelineNotes: '',
      keyFacts: [],
      missingFacts: [],
    },
    expectation: {
      purpose,
      goals,
      measures: [],
      assumptions: [],
    },
    evaluation: {
      rows: evalRows,
    },
    causeAnalysis: {
      whys: whyChains,
      controllability: [],
      brightSpots: [],
    },
    learning: {
      insights,
      rules: [],
      boundaries: [],
    },
  };

  return {
    id: createId(),
    type,
    title,
    status: 'draft',
    startDate,
    endDate,
    linkedGoalIds: [],
    linkedThemeNames: [],
    evidenceRefs: [],
    steps,
    conclusions: [],
    actionItems: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create an empty review case (no pre-population)
 */
export function createEmptyReviewCase(input: {
  type: ReviewCaseType;
  title: string;
  startDate: string;
  endDate: string;
}): ReviewCase {
  const now = new Date().toISOString();
  const emptySteps: ReviewSteps = {
    process: {
      timelineNotes: '',
      keyFacts: [],
      missingFacts: [],
    },
    expectation: {
      purpose: '',
      goals: [],
      measures: [],
      assumptions: [],
    },
    evaluation: {
      rows: [],
    },
    causeAnalysis: {
      whys: [],
      controllability: [],
      brightSpots: [],
    },
    learning: {
      insights: [],
      rules: [],
      boundaries: [],
    },
  };

  return {
    id: createId(),
    type: input.type,
    title: input.title,
    status: 'draft',
    startDate: input.startDate,
    endDate: input.endDate,
    linkedGoalIds: [],
    linkedThemeNames: [],
    evidenceRefs: [],
    steps: emptySteps,
    conclusions: [],
    actionItems: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a deviation row
 */
export function createDeviationRow(input: {
  level: 'purpose' | 'goal' | 'measure';
  expectation: string;
  result?: string;
  deviation?: string;
  status?: DeviationRow['status'];
}): DeviationRow {
  return {
    id: createId(),
    level: input.level,
    expectation: input.expectation,
    result: input.result || '',
    deviation: input.deviation || '',
    status: input.status || 'unclear',
    evidenceRefs: [],
  };
}

/**
 * Evaluate deviation status based on expectation and result
 */
export function evaluateDeviationStatus(
  expectation: string,
  result: string
): DeviationRow['status'] {
  if (!expectation.trim() || !result.trim()) {
    return 'unclear';
  }

  // Simple heuristic - can be enhanced with AI
  const resultLower = result.toLowerCase();

  if (resultLower.includes('完成') || resultLower.includes('达成') || resultLower.includes('成功')) {
    return 'met';
  }
  if (resultLower.includes('超额') || resultLower.includes('超过') || resultLower.includes('超出')) {
    return 'exceeded';
  }
  if (resultLower.includes('未') || resultLower.includes('没') || resultLower.includes('失败')) {
    return 'missed';
  }

  return 'unclear';
}

/**
 * Check if a review case has completed a specific step
 */
export function isStepCompleted(reviewCase: ReviewCase, step: keyof ReviewSteps): boolean {
  const steps = reviewCase.steps;

  switch (step) {
    case 'process': {
      const process = steps.process;
      return (
        process.keyFacts.length > 0 ||
        (process.timelineNotes?.trim().length ?? 0) > 0
      );
    }
    case 'expectation': {
      const expectation = steps.expectation;
      return (
        (expectation.purpose?.trim().length ?? 0) > 0 ||
        expectation.goals.length > 0 ||
        expectation.measures.length > 0
      );
    }
    case 'evaluation':
      return steps.evaluation.rows.length > 0;
    case 'causeAnalysis': {
      const causeAnalysis = steps.causeAnalysis;
      return (
        causeAnalysis.whys.length > 0 ||
        causeAnalysis.controllability.length > 0 ||
        causeAnalysis.brightSpots.length > 0
      );
    }
    case 'learning': {
      const learning = steps.learning;
      return (
        learning.insights.length > 0 ||
        learning.rules.length > 0 ||
        learning.boundaries.length > 0
      );
    }
    default:
      return false;
  }
}

/**
 * Get step completion count
 */
export function getStepCompletionCount(reviewCase: ReviewCase): number {
  const steps: Array<keyof ReviewSteps> = ['process', 'expectation', 'evaluation', 'causeAnalysis', 'learning'];
  return steps.filter((step) => isStepCompleted(reviewCase, step)).length;
}
