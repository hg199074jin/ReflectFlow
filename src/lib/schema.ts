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

export type ViewMode = 'cards' | 'gantt' | 'stats' | 'review';
export type AppMode = 'checkin' | 'browse';

export interface ClassifiableBullet {
  entryId: string;
  date: string;
  category: Category;
  bulletId: string;
  text: string;
}
