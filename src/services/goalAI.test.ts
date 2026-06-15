import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeGoalDefinition, decomposeGoal, suggestDailyAdjustment } from './goalAI';
import type { Goal, DailyGoalTarget, GapReason } from '../lib/schema';
import type { LLMSettings } from './llm/types';

// Mock the streaming module
vi.mock('./llm/streaming', () => ({
  streamChatCompletion: vi.fn(),
}));

// Mock the prompt builders (they are pure and don't need real logic)
vi.mock('../lib/goalPrompts', () => ({
  buildCompleteGoalDefinitionPrompt: vi.fn(() => 'mock-definition-prompt'),
  buildDecomposeGoalPrompt: vi.fn(() => 'mock-decompose-prompt'),
  buildDailyAdjustmentPrompt: vi.fn(() => 'mock-adjustment-prompt'),
}));

const mockSettings: LLMSettings = {
  provider: 'openai-compatible',
  apiKey: 'test-key',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.test.com/v1',
};

const mockGoal: Goal = {
  id: 'g1',
  title: 'Learn TypeScript',
  period: 'month',
  startDate: '2026-06-01',
  endDate: '2026-07-01',
  status: 'active',
  linkedBullets: [],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

const mockDailyTarget: DailyGoalTarget = {
  id: 'dt1',
  goalId: 'g1',
  date: '2026-06-15',
  plannedTask: 'Read TS handbook chapter 1',
  minimumStandard: 'Complete 50% of chapter',
  expectedOutput: 'Summary notes',
  reviewQuestions: ['What was confusing?'],
  status: 'pending',
  createdBy: 'ai',
  createdAt: '2026-06-15T00:00:00Z',
  updatedAt: '2026-06-15T00:00:00Z',
};

describe('goalAI', () => {
  let streamChatCompletion: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./llm/streaming');
    streamChatCompletion = mod.streamChatCompletion as ReturnType<typeof vi.fn>;
  });

  // -----------------------------------------------------------------------
  // completeGoalDefinition
  // -----------------------------------------------------------------------
  describe('completeGoalDefinition', () => {
    it('parses valid JSON response', async () => {
      const json = JSON.stringify({
        successCriteria: ['Write 100 lines of TS'],
        constraints: ['Only 2 hours per day'],
        risks: ['Losing motivation'],
        acceptanceMethod: 'Submit a small project',
        clarificationQuestions: ['Have you used JS before?'],
      });

      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onChunk(json);
          opts.onComplete(json);
        },
      );

      const result = await completeGoalDefinition(mockGoal, mockSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCriteria).toEqual(['Write 100 lines of TS']);
        expect(result.data.constraints).toEqual(['Only 2 hours per day']);
        expect(result.data.risks).toEqual(['Losing motivation']);
        expect(result.data.acceptanceMethod).toBe('Submit a small project');
        expect(result.data.clarificationQuestions).toEqual(['Have you used JS before?']);
      }
    });

    it('returns failure when JSON is invalid', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onChunk('not valid json at all');
          opts.onComplete('not valid json at all');
        },
      );

      const result = await completeGoalDefinition(mockGoal, mockSettings);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('All parsing strategies failed');
      }
    });

    it('returns failure when schema validation fails (missing required field)', async () => {
      const incomplete = JSON.stringify({
        successCriteria: ['c1'],
        // missing constraints, risks, acceptanceMethod
      });

      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onChunk(incomplete);
          opts.onComplete(incomplete);
        },
      );

      const result = await completeGoalDefinition(mockGoal, mockSettings);
      expect(result.success).toBe(false);
    });

    it('returns failure when streamChatCompletion reports an error', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onError(new Error('Invalid API key'));
        },
      );

      const result = await completeGoalDefinition(mockGoal, mockSettings);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
      }
    });
  });

  // -----------------------------------------------------------------------
  // decomposeGoal
  // -----------------------------------------------------------------------
  describe('decomposeGoal', () => {
    const validPlanJson = JSON.stringify({
      summary: 'Break goal into weekly milestones',
      milestones: [
        {
          id: 'm1',
          goalId: 'g1',
          title: 'Basics',
          startDate: '2026-06-01',
          endDate: '2026-06-07',
          expectedOutput: 'Hello world in TS',
          status: 'pending',
          createdAt: '2026-06-01T00:00:00Z',
          updatedAt: '2026-06-01T00:00:00Z',
        },
      ],
      dailyTargets: [
        {
          id: 'dt1',
          goalId: 'g1',
          milestoneId: 'm1',
          date: '2026-06-01',
          plannedTask: 'Read chapter 1',
          minimumStandard: 'Complete 50%',
          expectedOutput: 'Notes',
          reviewQuestions: ['What was hard?'],
          status: 'pending',
          createdBy: 'ai',
          createdAt: '2026-06-01T00:00:00Z',
          updatedAt: '2026-06-01T00:00:00Z',
        },
      ],
    });

    it('parses valid plan JSON response', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onChunk(validPlanJson);
          opts.onComplete(validPlanJson);
        },
      );

      const result = await decomposeGoal(mockGoal, mockSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe('Break goal into weekly milestones');
        expect(result.data.milestones).toHaveLength(1);
        expect(result.data.milestones[0]!.title).toBe('Basics');
        expect(result.data.dailyTargets).toHaveLength(1);
        expect(result.data.dailyTargets[0]!.plannedTask).toBe('Read chapter 1');
      }
    });

    it('returns failure when JSON is invalid', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onComplete('garbage');
        },
      );

      const result = await decomposeGoal(mockGoal, mockSettings);
      expect(result.success).toBe(false);
    });

    it('returns failure when milestone status is invalid', async () => {
      const badStatus = JSON.stringify({
        summary: 's',
        milestones: [
          {
            id: 'm1', goalId: 'g1', title: 't',
            startDate: '2026-06-01', endDate: '2026-06-07',
            expectedOutput: 'o', status: 'INVALID_STATUS',
            createdAt: '', updatedAt: '',
          },
        ],
        dailyTargets: [],
      });

      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onComplete(badStatus);
        },
      );

      const result = await decomposeGoal(mockGoal, mockSettings);
      expect(result.success).toBe(false);
    });

    it('returns failure when streamChatCompletion reports an error', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onError(new Error('Rate limit exceeded'));
        },
      );

      const result = await decomposeGoal(mockGoal, mockSettings);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Rate limit exceeded');
      }
    });
  });

  // -----------------------------------------------------------------------
  // suggestDailyAdjustment
  // -----------------------------------------------------------------------
  describe('suggestDailyAdjustment', () => {
    const validAdjustmentJson = JSON.stringify({
      nextAdjustment: 'Reduce scope to reading only',
      shouldReduceScope: true,
      shouldChangePlan: false,
      suggestedTomorrowTask: 'Read half a chapter',
    });

    it('parses valid adjustment JSON response', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onChunk(validAdjustmentJson);
          opts.onComplete(validAdjustmentJson);
        },
      );

      const result = await suggestDailyAdjustment(
        mockGoal, mockDailyTarget, 'Read 30% of chapter', mockSettings,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nextAdjustment).toBe('Reduce scope to reading only');
        expect(result.data.shouldReduceScope).toBe(true);
        expect(result.data.shouldChangePlan).toBe(false);
        expect(result.data.suggestedTomorrowTask).toBe('Read half a chapter');
      }
    });

    it('works with gap and gapReasons parameters', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onChunk(validAdjustmentJson);
          opts.onComplete(validAdjustmentJson);
        },
      );

      const result = await suggestDailyAdjustment(
        mockGoal,
        mockDailyTarget,
        'Read 10%',
        mockSettings,
        undefined,
        'Only completed 10% instead of 50%',
        ['not_enough_time', 'low_energy'] as GapReason[],
      );
      expect(result.success).toBe(true);
    });

    it('returns failure when JSON is invalid', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onComplete('not json');
        },
      );

      const result = await suggestDailyAdjustment(
        mockGoal, mockDailyTarget, 'partial', mockSettings,
      );
      expect(result.success).toBe(false);
    });

    it('returns failure when streamChatCompletion reports an error', async () => {
      streamChatCompletion.mockImplementation(
        async (_msgs: unknown, _settings: unknown, opts: { onChunk: (t: string) => void; onComplete: (t: string) => void; onError: (e: Error) => void }) => {
          opts.onError(new Error('Network error'));
        },
      );

      const result = await suggestDailyAdjustment(
        mockGoal, mockDailyTarget, 'x', mockSettings,
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error');
      }
    });
  });
});
