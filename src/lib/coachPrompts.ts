import type { Goal, DailyGoalTarget, Entry, GoalConflict, ReviewCase, Principle } from './schema';

export interface CoachContext {
  activeGoals: Goal[];
  recentDailyTargets: DailyGoalTarget[];
  recentEntries: Entry[];
  activeConflicts: GoalConflict[];
  recentConclusions: ReviewCase[];
  principleSnippets: Principle[];
}

export function buildCoachPrompt(question: string, context: CoachContext): string {
  return `你是 ReflectFlow 的 AI 教练。
用户问了一个问题，请根据以下上下文回答。

用户问题：${question}

上下文：
活跃目标：${JSON.stringify(context.activeGoals, null, 2)}
最近每日目标：${JSON.stringify(context.recentDailyTargets, null, 2)}
最近记录：${JSON.stringify(context.recentEntries.slice(0, 3), null, 2)}
活跃冲突：${JSON.stringify(context.activeConflicts, null, 2)}
最近复盘结论：${JSON.stringify(context.recentConclusions.slice(0, 2), null, 2)}
原则库摘要：${JSON.stringify(context.principleSnippets.slice(0, 5), null, 2)}

请给出具体、可操作的回答，引用用户数据中的具体内容。`;
}
