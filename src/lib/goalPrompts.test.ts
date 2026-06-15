import { describe, it, expect } from 'vitest';
import {
  buildCompleteGoalDefinitionPrompt,
  buildDecomposeGoalPrompt,
  buildDailyAdjustmentPrompt,
} from './goalPrompts';
import type { Goal } from './schema';

const sampleGoal: Goal = {
  id: 'g1',
  title: 'Test Goal',
  period: 'month',
  startDate: '2026-06-01',
  endDate: '2026-07-01',
  status: 'active',
  linkedBullets: [],
  createdAt: '',
  updatedAt: '',
};

const fullGoal: Goal = {
  ...sampleGoal,
  currentState: 'beginner',
  desiredOutcome: 'intermediate level',
  availableTime: '2 hours/day',
  successCriteria: ['Pass the exam', 'Complete all exercises'],
  constraints: ['Weekdays only', 'No tutor'],
  risks: ['Losing motivation', 'Work overtime'],
  acceptanceMethod: 'Submit final project',
};

describe('buildCompleteGoalDefinitionPrompt', () => {
  it('contains the goal title', () => {
    const p = buildCompleteGoalDefinitionPrompt(sampleGoal);
    expect(p).toContain('Test Goal');
  });

  it('contains the end date', () => {
    const p = buildCompleteGoalDefinitionPrompt(sampleGoal);
    expect(p).toContain('2026-07-01');
  });

  it('shows placeholder when optional fields are missing', () => {
    const p = buildCompleteGoalDefinitionPrompt(sampleGoal);
    expect(p).toContain('（未填写）');
  });

  it('includes optional fields when provided', () => {
    const p = buildCompleteGoalDefinitionPrompt(fullGoal);
    expect(p).toContain('beginner');
    expect(p).toContain('intermediate level');
    expect(p).toContain('2 hours/day');
  });

  it('always contains the JSON output format', () => {
    const p = buildCompleteGoalDefinitionPrompt(sampleGoal);
    expect(p).toContain('"successCriteria"');
    expect(p).toContain('"constraints"');
    expect(p).toContain('"risks"');
    expect(p).toContain('"acceptanceMethod"');
    expect(p).toContain('"clarificationQuestions"');
  });
});

describe('buildDecomposeGoalPrompt', () => {
  it('contains endDate', () => {
    const p = buildDecomposeGoalPrompt(sampleGoal);
    expect(p).toContain('2026-07-01');
  });

  it('includes success criteria when provided', () => {
    const p = buildDecomposeGoalPrompt(fullGoal);
    expect(p).toContain('Pass the exam');
    expect(p).toContain('Complete all exercises');
  });

  it('includes constraints when provided', () => {
    const p = buildDecomposeGoalPrompt(fullGoal);
    expect(p).toContain('Weekdays only');
  });

  it('includes risks when provided', () => {
    const p = buildDecomposeGoalPrompt(fullGoal);
    expect(p).toContain('Losing motivation');
  });

  it('always contains the JSON output format', () => {
    const p = buildDecomposeGoalPrompt(sampleGoal);
    expect(p).toContain('"summary"');
    expect(p).toContain('"milestones"');
    expect(p).toContain('"dailyTargets"');
    expect(p).toContain('"reviewQuestions"');
    expect(p).toContain('"deviationCriteria"');
  });
});

describe('buildDailyAdjustmentPrompt', () => {
  it('contains actual progress', () => {
    const p = buildDailyAdjustmentPrompt(sampleGoal, 'half done', 'behind');
    expect(p).toContain('half done');
  });

  it('contains gap when provided', () => {
    const p = buildDailyAdjustmentPrompt(sampleGoal, 'done', 'missed 2 items');
    expect(p).toContain('missed 2 items');
  });

  it('shows placeholder when gap is not provided', () => {
    const p = buildDailyAdjustmentPrompt(sampleGoal, 'done');
    expect(p).toContain('（未填写）');
  });

  it('includes gap reasons in Chinese when provided', () => {
    const p = buildDailyAdjustmentPrompt(
      sampleGoal,
      'partial',
      'behind schedule',
      ['not_enough_time', 'technical_blocker'],
    );
    expect(p).toContain('时间不足');
    expect(p).toContain('技术阻碍');
  });

  it('always contains the JSON output format', () => {
    const p = buildDailyAdjustmentPrompt(sampleGoal, 'done');
    expect(p).toContain('"nextAdjustment"');
    expect(p).toContain('"shouldReduceScope"');
    expect(p).toContain('"shouldChangePlan"');
    expect(p).toContain('"suggestedTomorrowTask"');
  });
});
