import { z } from 'zod';

export const categorySchema = z.enum(['work', 'study', 'side']);
export type Category = z.infer<typeof categorySchema>;

export const bulletSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type Bullet = z.infer<typeof bulletSchema>;

export const projectRefSchema = z.object({
  entryId: z.string(),
  bulletId: z.string(),
});

// 复盘标签
export const reviewTagSchema = z.enum([
  'success',      // 成功经验
  'failure',      // 失败教训
  'insight',      // 认知升级
  'habit',        // 习惯养成
  'relationship', // 人际关系
  'project',      // 项目管理
  'time',         // 时间管理
  'emotion',      // 情绪管理
]);
export type ReviewTag = z.infer<typeof reviewTagSchema>;

export const REVIEW_TAG_LABELS: Record<ReviewTag, string> = {
  success: '成功经验',
  failure: '失败教训',
  insight: '认知升级',
  habit: '习惯养成',
  relationship: '人际关系',
  project: '项目管理',
  time: '时间管理',
  emotion: '情绪管理',
};

// 每日复盘数据
export const dailyReviewSchema = z.object({
  target: z.string().optional(),           // 今日目标
  gap: z.string().optional(),              // 差距分析
  reason: z.string().optional(),           // 原因分析
  whatIf: z.string().optional(),           // 推演：如果重来
  lesson: z.string().optional(),           // 经验提炼
  tags: z.array(reviewTagSchema).optional(), // 复盘标签
  quality: z.number().min(1).max(5).optional(), // 复盘质量评分
});
export type DailyReview = z.infer<typeof dailyReviewSchema>;

// 周复盘数据
export const weeklyReviewSchema = z.object({
  weekStart: z.string(),
  target: z.string().optional(),           // 本周目标
  completed: z.string().optional(),        // 完成了什么
  notCompleted: z.string().optional(),     // 没完成什么
  unexpected: z.string().optional(),       // 意外收获
  keyEvent: z.string().optional(),         // 关键事件描述
  keyEventReview: z.string().optional(),   // 关键事件深度复盘
  pattern: z.string().optional(),          // 规律提炼
  adjustment: z.string().optional(),       // 下周调整
  summary: z.string().optional(),          // AI生成的周总结
  tags: z.array(reviewTagSchema).optional(),
});
export type WeeklyReview = z.infer<typeof weeklyReviewSchema>;

export const aiDataSchema = z.object({
  reflection: z.string().optional(),
  questions: z.array(z.string()).optional(),  // AI引导提问
  questionAnswers: z.array(z.string()).optional(),  // 用户对引导提问的回答
  weekSummary: z.object({ weekStart: z.string(), content: z.string() }).optional(),
  projects: z.array(z.object({
    name: z.string(),
    category: categorySchema.optional(),
    bulletRefs: z.array(projectRefSchema),
  })).optional(),
  lastError: z.string().optional(),
}).optional();

export const entrySchema = z.object({
  id: z.string(),
  date: z.string(),
  bullets: z.object({
    work: z.array(bulletSchema),
    study: z.array(bulletSchema),
    side: z.array(bulletSchema),
  }),
  rawText: z.object({
    work: z.string().optional(),
    study: z.string().optional(),
    side: z.string().optional(),
  }).optional(),
  review: dailyReviewSchema.optional(),  // 每日复盘数据
  ai: aiDataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Entry = z.infer<typeof entrySchema>;

export const settingsSchema = z.object({
  llm: z.object({
    provider: z.literal('openai-compatible'),
    apiKey: z.string().optional(),
    model: z.string(),
    baseUrl: z.string(),
  }),
  export: z.object({
    folderStructure: z.enum(['flat', 'year-month']),
    includeAI: z.boolean(),
  }),
});
export type Settings = z.infer<typeof settingsSchema>;

export type ViewMode = 'cards' | 'experience' | 'gantt' | 'stats' | 'review' | 'goals' | 'reports' | 'insights' | 'reviews' | 'preview' | 'principles' | 'search';
export type AppMode = 'checkin' | 'browse';

export interface ClassifiableBullet {
  entryId: string;
  date: string;
  category: Category;
  bulletId: string;
  text: string;
}

// ========================================
// Pro Upgrade Types
// ========================================

// 证据引用
export const evidenceRefSchema = z.object({
  entryId: z.string(),
  date: z.string(),
  category: categorySchema,
  bulletId: z.string(),
  text: z.string(),
});
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

// 目标
export const goalPeriodSchema = z.enum(['week', 'month']);
export type GoalPeriod = z.infer<typeof goalPeriodSchema>;

export const goalStatusSchema = z.enum(['active', 'done', 'paused', 'dropped']);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  period: goalPeriodSchema,
  startDate: z.string(),
  endDate: z.string(),
  status: goalStatusSchema,
  linkedBullets: z.array(projectRefSchema),
  notes: z.string().optional(),
  ai: z.object({
    progressSummary: z.string().optional(),
    risk: z.string().optional(),
    nextAction: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Goal = z.infer<typeof goalSchema>;

// 报告
export const reportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
});
export type ReportSection = z.infer<typeof reportSectionSchema>;

export const generatedReportSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  title: z.string(),
  period: z.enum(['week', 'month']),
  startDate: z.string(),
  endDate: z.string(),
  content: z.string(),
  sections: z.array(reportSectionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GeneratedReport = z.infer<typeof generatedReportSchema>;

// 洞察
export const insightTypeSchema = z.enum([
  'goal-drift',
  'stalled-theme',
  'recurring-problem',
  'success-pattern',
  'review-quality',
  'activity-distribution',
]);
export type InsightType = z.infer<typeof insightTypeSchema>;

export const insightSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type InsightSeverity = z.infer<typeof insightSeveritySchema>;

export const insightSchema = z.object({
  id: z.string(),
  type: insightTypeSchema,
  title: z.string(),
  summary: z.string(),
  severity: insightSeveritySchema,
  periodStart: z.string(),
  periodEnd: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
  createdAt: z.string(),
});
export type Insight = z.infer<typeof insightSchema>;

// 报告模板
export interface ReportTemplate {
  id: string;
  name: string;
  period: 'week' | 'month';
  description: string;
  sections: Array<{ id: string; title: string }>;
  requiresEvidence: boolean;
}

// ========================================
// Plus Review Method Types
// ========================================

// 复盘案例类型
export const reviewCaseTypeSchema = z.enum(['daily', 'weekly', 'monthly', 'goal', 'theme', 'event', 'benchmark']);
export type ReviewCaseType = z.infer<typeof reviewCaseTypeSchema>;

export const REVIEW_CASE_TYPE_LABELS: Record<ReviewCaseType, string> = {
  daily: '每日复盘',
  weekly: '每周复盘',
  monthly: '每月复盘',
  goal: '目标复盘',
  theme: '主题复盘',
  event: '事件复盘',
  benchmark: '标杆复盘',
};

// 复盘案例状态
export const reviewCaseStatusSchema = z.enum(['draft', 'in-review', 'completed', 'archived']);
export type ReviewCaseStatus = z.infer<typeof reviewCaseStatusSchema>;

export const REVIEW_CASE_STATUS_LABELS: Record<ReviewCaseStatus, string> = {
  draft: '草稿',
  'in-review': '进行中',
  completed: '已完成',
  archived: '已归档',
};

// 偏差行
export const deviationRowSchema = z.object({
  id: z.string(),
  level: z.enum(['purpose', 'goal', 'measure']),
  expectation: z.string(),
  result: z.string(),
  deviation: z.string(),
  status: z.enum(['met', 'missed', 'exceeded', 'unclear', 'not-measurable']),
  evidenceRefs: z.array(evidenceRefSchema),
});
export type DeviationRow = z.infer<typeof deviationRowSchema>;

export const DEVIATION_STATUS_LABELS: Record<DeviationRow['status'], string> = {
  met: '达成',
  missed: '未达成',
  exceeded: '超预期',
  unclear: '目标不清',
  'not-measurable': '无法评估',
};

// Why 链
export const whyChainSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  depth: z.number().int().min(1),
  parentId: z.string().optional(),
});
export type WhyChain = z.infer<typeof whyChainSchema>;

// 原因项
export const causeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  controllability: z.enum(['controllable', 'influenceable', 'uncontrollable']),
  source: z.enum(['subjective', 'objective', 'mixed']),
  evidenceRefs: z.array(evidenceRefSchema),
});
export type CauseItem = z.infer<typeof causeItemSchema>;

export const CONTROLLABILITY_LABELS: Record<CauseItem['controllability'], string> = {
  controllable: '可控',
  influenceable: '可影响',
  uncontrollable: '不可控',
};

export const CAUSE_SOURCE_LABELS: Record<CauseItem['source'], string> = {
  subjective: '主观',
  objective: '客观',
  mixed: '混合',
};

// 复盘步骤
export const reviewStepsSchema = z.object({
  process: z.object({
    timelineNotes: z.string().optional(),
    keyFacts: z.array(evidenceRefSchema),
    missingFacts: z.array(z.string()),
  }),
  expectation: z.object({
    purpose: z.string().optional(),
    goals: z.array(z.string()),
    measures: z.array(z.string()),
    assumptions: z.array(z.string()),
  }),
  evaluation: z.object({
    rows: z.array(deviationRowSchema),
  }),
  causeAnalysis: z.object({
    whys: z.array(whyChainSchema),
    controllability: z.array(causeItemSchema),
    brightSpots: z.array(causeItemSchema),
  }),
  learning: z.object({
    insights: z.array(z.string()),
    rules: z.array(z.string()),
    boundaries: z.array(z.string()),
  }),
});
export type ReviewSteps = z.infer<typeof reviewStepsSchema>;

// 结论质量
export const conclusionQualitySchema = z.object({
  score: z.number().min(0).max(100),
  accidentalFactorRisk: z.enum(['low', 'medium', 'high']),
  pointsToPersonRisk: z.enum(['low', 'medium', 'high']),
  whyDepth: z.number().int().min(0),
  hasCrossValidation: z.boolean(),
  verdict: z.enum(['ready', 'needs-evidence', 'needs-deeper-why', 'observation-only']),
});
export type ConclusionQuality = z.infer<typeof conclusionQualitySchema>;

export const QUALITY_VERDICT_LABELS: Record<ConclusionQuality['verdict'], string> = {
  ready: '可沉淀',
  'needs-evidence': '需补证据',
  'needs-deeper-why': '需继续追问',
  'observation-only': '仅作观察',
};

// 复盘结论
export const reviewConclusionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
  quality: conclusionQualitySchema,
  boundary: z.string().optional(),
  reusableAsPrinciple: z.boolean(),
  createdAt: z.string(),
});
export type ReviewConclusion = z.infer<typeof reviewConclusionSchema>;

// 行动项
export const reviewActionItemSchema = z.object({
  id: z.string(),
  mode: z.enum(['start', 'stop', 'continue']),
  title: z.string(),
  dueDate: z.string().optional(),
  linkedGoalId: z.string().optional(),
  completed: z.boolean(),
});
export type ReviewActionItem = z.infer<typeof reviewActionItemSchema>;

export const ACTION_MODE_LABELS: Record<ReviewActionItem['mode'], string> = {
  start: '开始做',
  stop: '停止做',
  continue: '继续做',
};

// 复盘案例
export const reviewCaseSchema = z.object({
  id: z.string(),
  type: reviewCaseTypeSchema,
  title: z.string(),
  status: reviewCaseStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
  linkedGoalIds: z.array(z.string()),
  linkedThemeNames: z.array(z.string()),
  evidenceRefs: z.array(evidenceRefSchema),
  steps: reviewStepsSchema,
  conclusions: z.array(reviewConclusionSchema),
  actionItems: z.array(reviewActionItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ReviewCase = z.infer<typeof reviewCaseSchema>;

// 事前沙盘
export const previewPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  purpose: z.string(),
  goals: z.array(z.string()),
  strategies: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  contingencies: z.array(z.string()),
  linkedGoalIds: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PreviewPlan = z.infer<typeof previewPlanSchema>;

// 复盘原则
export const principleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  sourceConclusionId: z.string(),
  sourceReviewCaseId: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
  applicableContexts: z.array(z.string()),
  boundaries: z.array(z.string()),
  verificationStatus: z.enum(['unverified', 'testing', 'validated', 'invalidated']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Principle = z.infer<typeof principleSchema>;

export const VERIFICATION_STATUS_LABELS: Record<Principle['verificationStatus'], string> = {
  unverified: '未验证',
  testing: '验证中',
  validated: '已验证',
  invalidated: '已失效',
};
