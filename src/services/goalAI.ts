import { z } from 'zod';
import { streamChatCompletion, type ChatMessage } from './llm/streaming';
import { parseAIJSON } from '../lib/aiJsonParser';
import {
  buildCompleteGoalDefinitionPrompt,
  buildDecomposeGoalPrompt,
  buildDailyAdjustmentPrompt,
  buildGoalQualityPrompt,
  buildConflictDetectionPrompt,
  buildWeeklyGoalReviewPrompt,
  buildGoalFinalReportPrompt,
  buildPrincipleExtractionPrompt,
  buildPremortemPrompt,
} from '../lib/goalPrompts';
import type { LLMSettings } from './llm/types';
import type { Goal, GoalPlan, GoalFinalReport, DailyGoalTarget, GapReason } from '../lib/schema';

// ---------------------------------------------------------------------------
// Zod schemas for validating AI responses
// ---------------------------------------------------------------------------

const goalDefinitionResultSchema = z.object({
  successCriteria: z.array(z.string()),
  constraints: z.array(z.string()),
  risks: z.array(z.string()),
  acceptanceMethod: z.string(),
  clarificationQuestions: z.array(z.string()).optional(),
});
export type GoalDefinitionResult = z.infer<typeof goalDefinitionResultSchema>;

const goalPlanResultSchema = z.object({
  summary: z.string(),
  milestones: z.array(z.object({
    id: z.string(),
    goalId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startDate: z.string(),
    endDate: z.string(),
    expectedOutput: z.string(),
    successCriteria: z.array(z.string()).optional(),
    status: z.enum(['pending', 'in_progress', 'done', 'blocked']),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  dailyTargets: z.array(z.object({
    id: z.string(),
    goalId: z.string(),
    milestoneId: z.string().optional(),
    date: z.string(),
    plannedTask: z.string(),
    minimumStandard: z.string(),
    expectedOutput: z.string(),
    reviewQuestions: z.array(z.string()),
    deviationCriteria: z.array(z.string()).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'partially_completed', 'missed', 'adjusted']),
    createdBy: z.enum(['ai', 'user']),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
});
export type GoalPlanResult = z.infer<typeof goalPlanResultSchema>;

const dailyAdjustmentResultSchema = z.object({
  nextAdjustment: z.string(),
  shouldReduceScope: z.boolean(),
  shouldChangePlan: z.boolean(),
  suggestedTomorrowTask: z.string().optional(),
});
export type DailyAdjustmentResult = z.infer<typeof dailyAdjustmentResultSchema>;

// ---------------------------------------------------------------------------
// Result type shared by all three functions
// ---------------------------------------------------------------------------

export type GoalAIResult<T> =
  | { success: true; data: T }
  | { success: false; raw: string; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect streaming text and resolve with the full output. */
function collectStream(
  messages: ChatMessage[],
  settings: LLMSettings,
  signal?: AbortSignal,
  onChunk?: (accumulated: string) => void,
): Promise<{ fullText: string; error?: Error }> {
  return new Promise((resolve) => {
    let fullText = '';
    streamChatCompletion(messages, settings, {
      onChunk: (chunk) => {
        fullText += chunk;
        onChunk?.(fullText);
      },
      onComplete: () => resolve({ fullText }),
      onError: (err) => resolve({ fullText, error: err }),
      signal,
    });
  });
}

/** Generic goal AI call: stream → collect → parse with Zod schema. */
async function callGoalAI<T>(
  userPrompt: string,
  systemNoun: string,
  schema: z.ZodSchema<T>,
  settings: LLMSettings,
  options?: { signal?: AbortSignal; onChunk?: (accumulated: string) => void },
): Promise<GoalAIResult<T>> {
  const messages: ChatMessage[] = [
    { role: 'system', content: `You are a helpful ${systemNoun} coach. Always respond with valid JSON only.` },
    { role: 'user', content: userPrompt },
  ];
  const { fullText, error } = await collectStream(messages, settings, options?.signal, options?.onChunk);
  if (error) return { success: false, raw: fullText, error: error.message };
  return parseAIJSON<T>(fullText, schema);
}

// ---------------------------------------------------------------------------
// 1. completeGoalDefinition
// ---------------------------------------------------------------------------

/** Call AI to enrich a goal definition with success criteria, constraints, risks, acceptance method. */
export function completeGoalDefinition(
  goal: Goal,
  settings: LLMSettings,
  options?: { signal?: AbortSignal; onChunk?: (accumulated: string) => void },
): Promise<GoalAIResult<GoalDefinitionResult>> {
  return callGoalAI(buildCompleteGoalDefinitionPrompt(goal), 'goal-definition', goalDefinitionResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 2. decomposeGoal
// ---------------------------------------------------------------------------

/** Call AI to decompose a goal into milestones and 7-day daily targets. */
export function decomposeGoal(
  goal: Goal,
  settings: LLMSettings,
  options?: { signal?: AbortSignal; onChunk?: (accumulated: string) => void },
): Promise<GoalAIResult<GoalPlanResult>> {
  return callGoalAI(buildDecomposeGoalPrompt(goal), 'goal-decomposition', goalPlanResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 3. suggestDailyAdjustment
// ---------------------------------------------------------------------------

/** Call AI to suggest adjustments after a daily review, given the gap between planned and actual progress. */
export function suggestDailyAdjustment(
  goal: Goal,
  _dailyTarget: DailyGoalTarget,
  actualProgress: string,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
  gap?: string,
  gapReasons?: GapReason[],
): Promise<GoalAIResult<DailyAdjustmentResult>> {
  return callGoalAI(buildDailyAdjustmentPrompt(goal, actualProgress, gap, gapReasons), 'daily-review', dailyAdjustmentResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 4. scoreGoalQuality
// ---------------------------------------------------------------------------

const goalQualityResultSchema = z.object({
  totalScore: z.number(),
  specificityScore: z.number(),
  measurabilityScore: z.number(),
  timeBoundScore: z.number(),
  currentStateScore: z.number(),
  successCriteriaScore: z.number(),
  constraintsScore: z.number(),
  decomposabilityScore: z.number(),
  realismScore: z.number(),
  conflictScore: z.number(),
  reviewValueScore: z.number(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
});
export type GoalQualityResult = z.infer<typeof goalQualityResultSchema>;

/** Call AI to score a goal's quality across 10 dimensions. */
export function scoreGoalQuality(
  goal: Goal,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<GoalQualityResult>> {
  return callGoalAI(buildGoalQualityPrompt(goal), 'goal-quality-assessment', goalQualityResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 5. detectGoalConflicts
// ---------------------------------------------------------------------------

const conflictItemSchema = z.object({
  goalIds: z.array(z.string()),
  type: z.enum([
    'time_conflict', 'energy_conflict', 'priority_conflict',
    'resource_conflict', 'direction_conflict', 'identity_conflict',
    'short_long_term_conflict',
  ]),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  evidence: z.array(z.string()),
  suggestion: z.string(),
});

const conflictDetectionResultSchema = z.object({
  conflicts: z.array(conflictItemSchema),
});
export type ConflictDetectionResult = z.infer<typeof conflictDetectionResultSchema>;

/** Call AI to detect conflicts among multiple active goals. */
export function detectGoalConflicts(
  goals: Goal[],
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<ConflictDetectionResult>> {
  return callGoalAI(buildConflictDetectionPrompt(goals), 'goal-conflict-detection', conflictDetectionResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 6. generateWeeklyGoalReview
// ---------------------------------------------------------------------------

const weeklyGoalReviewResultSchema = z.object({
  completionSummary: z.string(),
  completedTargets: z.number(),
  missedTargets: z.number(),
  adjustedTargets: z.number(),
  mainDeviations: z.array(z.string()),
  recurringBlockers: z.array(z.string()),
  effectiveActions: z.array(z.string()),
  ineffectiveActions: z.array(z.string()),
  nextWeekSuggestions: z.array(z.string()),
  goalsToPrioritize: z.array(z.string()),
  goalsToPause: z.array(z.string()),
});
export type WeeklyGoalReviewResult = z.infer<typeof weeklyGoalReviewResultSchema>;

/** Call AI to generate a weekly goal review with calibration suggestions. */
export function generateWeeklyGoalReview(
  weekStart: string,
  weekEnd: string,
  goals: Goal[],
  dailyTargets: DailyGoalTarget[],
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<WeeklyGoalReviewResult>> {
  return callGoalAI(buildWeeklyGoalReviewPrompt(weekStart, weekEnd, goals, dailyTargets), 'weekly-goal-review', weeklyGoalReviewResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 7. generateGoalFinalReport
// ---------------------------------------------------------------------------

const goalFinalReportResultSchema = z.object({
  title: z.string(),
  originalGoal: z.string(),
  successCriteria: z.array(z.string()),
  finalOutcome: z.string(),
  completionLevel: z.enum(['completed', 'partially_completed', 'failed', 'abandoned']),
  keyActions: z.array(z.string()),
  majorDeviations: z.array(z.string()),
  rootCauses: z.array(z.string()),
  adjustments: z.array(z.string()),
  effectiveActions: z.array(z.string()),
  ineffectiveActions: z.array(z.string()),
  principles: z.array(z.string()),
  nextTimeSuggestions: z.array(z.string()),
});
export type GoalFinalReportResult = z.infer<typeof goalFinalReportResultSchema>;

/** Call AI to generate a goal final report based on goal execution and plan. */
export function generateGoalFinalReport(
  goal: Goal,
  plan: GoalPlan | undefined,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<GoalFinalReportResult>> {
  return callGoalAI(buildGoalFinalReportPrompt(goal, plan), 'goal-final-report', goalFinalReportResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 8. extractGoalPrinciples
// ---------------------------------------------------------------------------

const principleItemSchema = z.object({
  principleTitle: z.string(),
  principleContent: z.string(),
  sourceEvidence: z.array(z.string()),
  applicableScenarios: z.array(z.string()),
  boundaryConditions: z.array(z.string()),
  counterExamples: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
});

const principleExtractionResultSchema = z.object({
  principles: z.array(principleItemSchema),
});
export type PrincipleExtractionResult = z.infer<typeof principleExtractionResultSchema>;

/** Call AI to extract reusable principles from a goal final report. */
export function extractGoalPrinciples(
  goal: Goal,
  report: GoalFinalReport,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<PrincipleExtractionResult>> {
  return callGoalAI(buildPrincipleExtractionPrompt(goal, report), 'principle-extraction', principleExtractionResultSchema, settings, options);
}

// ---------------------------------------------------------------------------
// 9. generatePremortem
// ---------------------------------------------------------------------------

const premortemResultSchema = z.object({
  predictedFailureReasons: z.array(z.string()),
  underestimatedConstraints: z.array(z.string()),
  likelyDelays: z.array(z.string()),
  triggerConditions: z.array(z.string()),
  minimumViablePath: z.string(),
});
export type PremortemResult = z.infer<typeof premortemResultSchema>;

/** Call AI to generate a premortem analysis for a goal. */
export function generatePremortem(
  goal: Goal,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<PremortemResult>> {
  return callGoalAI(buildPremortemPrompt(goal), 'premortem-analysis', premortemResultSchema, settings, options);
}
