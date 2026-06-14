import type { ReviewCase } from '../../lib/schema';

/**
 * Build prompt for AI questioner
 * The questioner asks questions to push thinking deeper
 */
export function buildQuestionerPrompt(input: {
  reviewCase: ReviewCase;
  currentStep: string;
  evidence: Array<{ date: string; text: string }>;
  whyChains: Array<{ id?: string; question: string; answer: string; depth: number }>;
}): string {
  const { reviewCase, currentStep, evidence, whyChains } = input;

  const evidenceText = evidence.map((e) => `- [${e.date}] ${e.text}`).join('\n');
  const whyText = whyChains.map((w) => `${'  '.repeat(w.depth - 1)}Q: ${w.question}\nA: ${w.answer}`).join('\n');

  return `你是一个复盘设问人。你的职责是通过提问推动思考深入，而不是直接给出答案。

## 当前复盘案例
- 标题：${reviewCase.title}
- 类型：${reviewCase.type}
- 时间：${reviewCase.startDate} ~ ${reviewCase.endDate}

## 当前步骤
${currentStep}

## 已有事实
${evidenceText || '暂无'}

## 已有追问链
${whyText || '暂无'}

## 你的任务
请生成 3-5 个问题，用于推动复盘思考深入。问题应该：

1. **针对事实缺口**：如果某些关键信息缺失，询问具体情况
2. **针对目的不清**：如果目的/目标不明确，追问"为什么要做这件事"
3. **针对偏差**：如果有预期与结果的偏差，追问"差距在哪里，为什么"
4. **连续追问**：对已有的 why 链继续深入，至少追问到第 3 层
5. **挑战弱结论**：对"我觉得""可能是""没办法"等表述继续追问

## 注意事项
- 只提问，不回答
- 问题要具体，不要泛泛而问
- 优先使用事实、目标、偏差来提问
- 不要问"你有什么感受"这种无效问题

请直接输出问题列表，每行一个问题。`;
}

/**
 * Build prompt for generating review questions for a specific entry
 */
export function buildEntryReviewQuestionPrompt(input: {
  date: string;
  bullets: string[];
  existingQuestions: string[];
}): string {
  const { date, bullets, existingQuestions } = input;

  const bulletText = bullets.map((b) => `- ${b}`).join('\n');
  const existingText = existingQuestions.map((q) => `- ${q}`).join('\n');

  return `你是一个每日复盘教练。请根据今天的记录生成 2-3 个引导问题。

## 今日记录（${date}）
${bulletText || '暂无记录'}

## 已有问题
${existingText || '暂无'}

## 要求
1. 问题要基于今天的具体记录
2. 引导思考目标达成情况
3. 引导思考改进空间
4. 不要重复已有问题

请直接输出问题列表，每行一个问题。`;
}

/**
 * Build prompt for generating weekly review questions
 */
export function buildWeeklyReviewQuestionPrompt(input: {
  weekStart: string;
  weekEnd: string;
  bulletSummary: string;
  goals: string[];
}): string {
  const { weekStart, weekEnd, bulletSummary, goals } = input;

  const goalsText = goals.map((g) => `- ${g}`).join('\n');

  return `你是一个周复盘教练。请根据本周的记录生成 3-5 个引导问题。

## 本周时间
${weekStart} ~ ${weekEnd}

## 本周记录摘要
${bulletSummary || '暂无记录'}

## 本周目标
${goalsText || '暂无目标'}

## 要求
1. 问题要基于本周的具体记录
2. 引导思考目标达成情况
3. 引导思考本周亮点和不足
4. 引导思考下周改进方向

请直接输出问题列表，每行一个问题。`;
}
