import { describe, it, expect } from 'vitest';
import {
  entrySchema, settingsSchema, categorySchema, goalStatusSchema, goalSchema,
  dailyGoalTargetSchema, goalConflictSchema, goalMilestoneSchema, goalPlanSchema,
  planAdjustmentSchema, weeklyGoalReviewSchema, goalFinalReportSchema,
  goalPrincipleExtractionSchema, goalPremortemSchema, goalPremortemReviewSchema,
} from './schema';

describe('categorySchema', () => {
  it('accepts valid categories', () => {
    expect(categorySchema.parse('work')).toBe('work');
    expect(categorySchema.parse('study')).toBe('study');
    expect(categorySchema.parse('side')).toBe('side');
  });

  it('rejects invalid category', () => {
    expect(() => categorySchema.parse('invalid')).toThrow();
  });
});

describe('entrySchema', () => {
  const validEntry = {
    id: 'abc-123',
    date: '2026-06-13',
    bullets: {
      work: [{ id: 'b1', text: 'task' }],
      study: [],
      side: [],
    },
    createdAt: '2026-06-13T10:00:00Z',
    updatedAt: '2026-06-13T10:00:00Z',
  };

  it('accepts valid entry', () => {
    const result = entrySchema.parse(validEntry);
    expect(result.id).toBe('abc-123');
    expect(result.bullets.work).toHaveLength(1);
  });

  it('accepts entry with AI data', () => {
    const withAi = {
      ...validEntry,
      ai: {
        reflection: 'Good day',
        weekSummary: { weekStart: '2026-06-08', content: 'Productive week' },
      },
    };
    const result = entrySchema.parse(withAi);
    expect(result.ai?.reflection).toBe('Good day');
  });

  it('rejects missing required fields', () => {
    expect(() => entrySchema.parse({ id: 'abc' })).toThrow();
  });
});

describe('settingsSchema', () => {
  const validSettings = {
    llm: {
      provider: 'openai-compatible',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
    },
    export: {
      folderStructure: 'year-month',
      includeAI: true,
    },
  };

  it('accepts valid settings', () => {
    const result = settingsSchema.parse(validSettings);
    expect(result.llm.provider).toBe('openai-compatible');
  });

  it('accepts settings with optional apiKey', () => {
    const withKey = { ...validSettings, llm: { ...validSettings.llm, apiKey: 'sk-xxx' } };
    const result = settingsSchema.parse(withKey);
    expect(result.llm.apiKey).toBe('sk-xxx');
  });

  it('rejects invalid provider', () => {
    const bad = { ...validSettings, llm: { ...validSettings.llm, provider: 'invalid' } };
    expect(() => settingsSchema.parse(bad)).toThrow();
  });

  it('rejects invalid folder structure', () => {
    const bad = { ...validSettings, export: { ...validSettings.export, folderStructure: 'bad' } };
    expect(() => settingsSchema.parse(bad)).toThrow();
  });
});

describe('goalStatusSchema', () => {
  it('accepts draft as a valid goal status', () => {
    expect(goalStatusSchema.parse('draft')).toBe('draft');
  });
});

describe('goalSchema backward compatibility', () => {
  it('accepts legacy goal without new fields', () => {
    const legacy = {
      id: 'g1', title: 'Test', period: 'month',
      startDate: '2026-06-01', endDate: '2026-07-01',
      status: 'active', linkedBullets: [],
      createdAt: '', updatedAt: '',
    };
    expect(goalSchema.parse(legacy)).toBeDefined();
  });

  it('preserves notes field on legacy goals', () => {
    const legacy = {
      id: 'g1', title: 'Test', period: 'month',
      startDate: '2026-06-01', endDate: '2026-07-01',
      status: 'active', linkedBullets: [],
      notes: 'some legacy notes',
      createdAt: '', updatedAt: '',
    };
    const parsed = goalSchema.parse(legacy);
    expect(parsed.notes).toBe('some legacy notes');
  });

  it('preserves linkedBullets array on legacy goals', () => {
    const legacy = {
      id: 'g1', title: 'Test', period: 'month',
      startDate: '2026-06-01', endDate: '2026-07-01',
      status: 'active',
      linkedBullets: [{ entryId: 'e1', bulletId: 'b1' }],
      createdAt: '', updatedAt: '',
    };
    const parsed = goalSchema.parse(legacy);
    expect(parsed.linkedBullets).toEqual([{ entryId: 'e1', bulletId: 'b1' }]);
  });
});

// ========================================
// Goal System Types (Tasks 1.9 + 1.10)
// ========================================

describe('goalMilestoneSchema', () => {
  it('validates a GoalMilestone', () => {
    const milestone = {
      id: 'm1', goalId: 'g1', title: 'Milestone 1',
      startDate: '2026-06-15', endDate: '2026-06-30',
      expectedOutput: 'output', status: 'pending',
      createdAt: '', updatedAt: '',
    };
    expect(goalMilestoneSchema.parse(milestone)).toBeDefined();
  });

  it('rejects invalid milestone status', () => {
    const bad = {
      id: 'm1', goalId: 'g1', title: 'M1',
      startDate: '2026-06-15', endDate: '2026-06-30',
      expectedOutput: 'out', status: 'invalid',
      createdAt: '', updatedAt: '',
    };
    expect(() => goalMilestoneSchema.parse(bad)).toThrow();
  });
});

describe('dailyGoalTargetSchema', () => {
  it('validates a complete DailyGoalTarget', () => {
    const target = {
      id: 'd1', goalId: 'g1', date: '2026-06-15',
      plannedTask: 't', minimumStandard: 'm', expectedOutput: 'e',
      reviewQuestions: ['q1'], status: 'pending', createdBy: 'ai',
      createdAt: '', updatedAt: '',
    };
    expect(dailyGoalTargetSchema.parse(target)).toBeDefined();
  });

  it('accepts optional milestoneId', () => {
    const target = {
      id: 'd1', goalId: 'g1', milestoneId: 'm1', date: '2026-06-15',
      plannedTask: 't', minimumStandard: 'm', expectedOutput: 'e',
      reviewQuestions: ['q1'], status: 'completed', createdBy: 'user',
      createdAt: '', updatedAt: '',
    };
    const parsed = dailyGoalTargetSchema.parse(target);
    expect(parsed.milestoneId).toBe('m1');
  });

  it('rejects invalid createdBy', () => {
    const bad = {
      id: 'd1', goalId: 'g1', date: '2026-06-15',
      plannedTask: 't', minimumStandard: 'm', expectedOutput: 'e',
      reviewQuestions: ['q1'], status: 'pending', createdBy: 'other',
      createdAt: '', updatedAt: '',
    };
    expect(() => dailyGoalTargetSchema.parse(bad)).toThrow();
  });
});

describe('goalPlanSchema', () => {
  it('validates a GoalPlan with nested milestones and dailyTargets', () => {
    const plan = {
      id: 'p1', goalId: 'g1', summary: 'plan summary',
      milestones: [{
        id: 'm1', goalId: 'g1', title: 'M1',
        startDate: '2026-06-15', endDate: '2026-06-30',
        expectedOutput: 'out', status: 'pending',
        createdAt: '', updatedAt: '',
      }],
      dailyTargets: [{
        id: 'd1', goalId: 'g1', date: '2026-06-15',
        plannedTask: 't', minimumStandard: 'm', expectedOutput: 'e',
        reviewQuestions: ['q1'], status: 'pending', createdBy: 'ai',
        createdAt: '', updatedAt: '',
      }],
      generatedBy: 'ai', generatedAt: '', version: 1,
    };
    expect(goalPlanSchema.parse(plan)).toBeDefined();
  });
});

describe('goalConflictSchema', () => {
  it('validates a GoalConflict', () => {
    const conflict = {
      id: 'c1', goalIds: ['g1'], type: 'time_conflict',
      severity: 'low', description: 'd', evidence: [], suggestion: 's',
      createdAt: '',
    };
    expect(goalConflictSchema.parse(conflict)).toBeDefined();
  });

  it('rejects invalid conflict type', () => {
    const bad = {
      id: 'c1', goalIds: ['g1'], type: 'unknown',
      severity: 'low', description: 'd', evidence: [], suggestion: 's',
      createdAt: '',
    };
    expect(() => goalConflictSchema.parse(bad)).toThrow();
  });
});

describe('planAdjustmentSchema', () => {
  it('validates a PlanAdjustment', () => {
    const adj = {
      id: 'a1', goalId: 'g1', reason: 'r', impact: 'i',
      adjustedTargets: [], postponedTargets: [], removedTargets: [],
      shouldChangeDeadline: false, shouldReduceScope: false,
      createdAt: '',
    };
    expect(planAdjustmentSchema.parse(adj)).toBeDefined();
  });
});

describe('weeklyGoalReviewSchema', () => {
  it('validates a WeeklyGoalReview', () => {
    const review = {
      id: 'w1', weekStart: '2026-06-08', weekEnd: '2026-06-14',
      goalIds: ['g1'], completionSummary: 'ok',
      completedTargets: 3, missedTargets: 1, adjustedTargets: 0,
      mainDeviations: [], recurringBlockers: [],
      effectiveActions: [], ineffectiveActions: [],
      nextWeekSuggestions: [], goalsToPrioritize: [], goalsToPause: [],
      createdAt: '',
    };
    expect(weeklyGoalReviewSchema.parse(review)).toBeDefined();
  });
});

describe('goalFinalReportSchema', () => {
  it('validates a GoalFinalReport', () => {
    const report = {
      id: 'fr1', goalId: 'g1', title: 'Final',
      period: { startDate: '2026-06-01', endDate: '2026-06-30' },
      originalGoal: 'goal', successCriteria: ['c1'],
      finalOutcome: 'done', completionLevel: 'completed',
      keyActions: [], majorDeviations: [], rootCauses: [],
      adjustments: [], effectiveActions: [], ineffectiveActions: [],
      principles: [], nextTimeSuggestions: [], markdown: '# report',
      createdAt: '',
    };
    expect(goalFinalReportSchema.parse(report)).toBeDefined();
  });

  it('rejects invalid completionLevel', () => {
    const bad = {
      id: 'fr1', goalId: 'g1', title: 'F',
      period: { startDate: '', endDate: '' },
      originalGoal: '', successCriteria: [],
      finalOutcome: '', completionLevel: 'unknown',
      keyActions: [], majorDeviations: [], rootCauses: [],
      adjustments: [], effectiveActions: [], ineffectiveActions: [],
      principles: [], nextTimeSuggestions: [], markdown: '',
      createdAt: '',
    };
    expect(() => goalFinalReportSchema.parse(bad)).toThrow();
  });
});

describe('goalPrincipleExtractionSchema', () => {
  it('validates a GoalPrincipleExtraction', () => {
    const pe = {
      id: 'pe1', goalId: 'g1',
      principleTitle: 'Title', principleContent: 'Content',
      sourceEvidence: [], applicableScenarios: [],
      boundaryConditions: [], counterExamples: [],
      confidence: 'high', createdAt: '',
    };
    expect(goalPrincipleExtractionSchema.parse(pe)).toBeDefined();
  });
});

describe('goalPremortemSchema', () => {
  it('validates a GoalPremortem', () => {
    const pm = {
      id: 'pm1', goalId: 'g1',
      predictedFailureReasons: [], underestimatedConstraints: [],
      likelyDelays: [], triggerConditions: [],
      minimumViablePath: 'path', createdAt: '',
    };
    expect(goalPremortemSchema.parse(pm)).toBeDefined();
  });
});

describe('goalPremortemReviewSchema', () => {
  it('validates a GoalPremortemReview', () => {
    const pr = {
      id: 'pr1', goalId: 'g1', premortemId: 'pm1',
      accuratePredictions: [], inaccuratePredictions: [],
      missedRisks: [], judgmentLessons: [], createdAt: '',
    };
    expect(goalPremortemReviewSchema.parse(pr)).toBeDefined();
  });
});
