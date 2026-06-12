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

export const aiDataSchema = z.object({
  reflection: z.string().optional(),
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
  bullets: z.record(categorySchema, z.array(bulletSchema)),
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

export type ViewMode = 'cards' | 'gantt' | 'stats';

export interface ClassifiableBullet {
  entryId: string;
  date: string;
  category: Category;
  bulletId: string;
  text: string;
}
