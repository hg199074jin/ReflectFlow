import { streamChatCompletion, type ChatMessage, type StreamingOptions } from './llm/streaming';
import { buildCoachPrompt, type CoachContext } from '../lib/coachPrompts';
import type { LLMSettings } from './llm/types';

/**
 * Ask the AI coach a question with full context.
 * Returns the streamed response as a string (not JSON).
 */
export async function askCoach(
  question: string,
  context: CoachContext,
  settings: LLMSettings,
  options?: StreamingOptions,
): Promise<void> {
  const userPrompt = buildCoachPrompt(question, context);
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful personal growth coach called ReflectFlow Coach. Answer in the same language as the user question. Be specific, actionable, and reference the user data provided.' },
    { role: 'user', content: userPrompt },
  ];

  await streamChatCompletion(messages, settings, {
    onChunk: options?.onChunk ?? (() => {}),
    onComplete: options?.onComplete ?? (() => {}),
    onError: options?.onError ?? (() => {}),
    signal: options?.signal,
  });
}
