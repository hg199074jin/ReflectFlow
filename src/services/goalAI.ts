import { z } from 'zod';
import { streamChatCompletion, type ChatMessage } from './llm/streaming';
import { parseAIJSON } from '../lib/aiJsonParser';
import {
  buildCompleteGoalDefinitionPrompt,
  buildDecomposeGoalPrompt,
  buildDailyAdjustmentPrompt,
} from '../lib/goalPrompts';
import type { LLMSettings } from './llm/types';
import type { Goal, DailyGoalTarget, GapReason } from '../lib/schema';

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
): Promise<{ fullText: string; error?: Error }> {
  return new Promise((resolve) => {
    let fullText = '';
    streamChatCompletion(messages, settings, {
      onChunk: (chunk) => { fullText += chunk; },
      onComplete: () => resolve({ fullText }),
      onError: (err) => resolve({ fullText, error: err }),
      signal,
    });
  });
}

// ---------------------------------------------------------------------------
// 1. completeGoalDefinition
// ---------------------------------------------------------------------------

/**
 * Call AI to enrich a goal definition with success criteria, constraints,
 * risks, acceptance method and optional clarification questions.
 */
export async function completeGoalDefinition(
  goal: Goal,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<GoalDefinitionResult>> {
  const userPrompt = buildCompleteGoalDefinitionPrompt(goal);
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful goal-definition coach. Always respond with valid JSON only.' },
    { role: 'user', content: userPrompt },
  ];

  const { fullText, error } = await collectStream(messages, settings, options?.signal);
  if (error) return { success: false, raw: fullText, error: error.message };

  return parseAIJSON<GoalDefinitionResult>(fullText, goalDefinitionResultSchema);
}

// ---------------------------------------------------------------------------
// 2. decomposeGoal
// ---------------------------------------------------------------------------

/**
 * Call AI to decompose a goal into milestones and 7-day daily targets.
 */
export async function decomposeGoal(
  goal: Goal,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
): Promise<GoalAIResult<GoalPlanResult>> {
  const userPrompt = buildDecomposeGoalPrompt(goal);
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful goal decomposition coach. Always respond with valid JSON only.' },
    { role: 'user', content: userPrompt },
  ];

  const { fullText, error } = await collectStream(messages, settings, options?.signal);
  if (error) return { success: false, raw: fullText, error: error.message };

  return parseAIJSON<GoalPlanResult>(fullText, goalPlanResultSchema);
}

// ---------------------------------------------------------------------------
// 3. suggestDailyAdjustment
// ---------------------------------------------------------------------------

/**
 * Call AI to suggest adjustments after a daily review, given the gap between
 * planned and actual progress.
 */
export async function suggestDailyAdjustment(
  goal: Goal,
  _dailyTarget: DailyGoalTarget,
  actualProgress: string,
  settings: LLMSettings,
  options?: { signal?: AbortSignal },
  gap?: string,
  gapReasons?: GapReason[],
): Promise<GoalAIResult<DailyAdjustmentResult>> {
  const userPrompt = buildDailyAdjustmentPrompt(goal, actualProgress, gap, gapReasons);
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful daily review coach. Always respond with valid JSON only.' },
    { role: 'user', content: userPrompt },
  ];

  const { fullText, error } = await collectStream(messages, settings, options?.signal);
  if (error) return { success: false, raw: fullText, error: error.message };

  return parseAIJSON<DailyAdjustmentResult>(fullText, dailyAdjustmentResultSchema);
}
