import type { Entry, ClassifiableBullet } from './schema';
import { formatBulletText } from './text';

/** 生成每日复盘引导提问 */
export function buildReflectionQuestionsPrompt(entry: Entry): string {
  const sections: string[] = [];

  if (entry.bullets.work.length > 0) {
    sections.push(`工作：\n${formatBulletText(entry.bullets.work)}`);
  }
  if (entry.bullets.study.length > 0) {
    sections.push(`学习：\n${formatBulletText(entry.bullets.study)}`);
  }
  if (entry.bullets.side.length > 0) {
    sections.push(`副业：\n${formatBulletText(entry.bullets.side)}`);
  }

  const reviewContext = [];
  if (entry.review?.target) reviewContext.push(`今日目标：${entry.review.target}`);
  if (entry.review?.gap) reviewContext.push(`差距分析：${entry.review.gap}`);
  if (entry.review?.reason) reviewContext.push(`原因分析：${entry.review.reason}`);
  if (entry.review?.whatIf) reviewContext.push(`推演思考：${entry.review.whatIf}`);
  if (entry.review?.lesson) reviewContext.push(`经验提炼：${entry.review.lesson}`);

  return `日期：${entry.date}

今日事项：
${sections.join('\n\n')}

${reviewContext.length > 0 ? '已有复盘：\n' + reviewContext.join('\n') : ''}

请根据以上内容，生成 3-5 个复盘引导问题。

要求：
1. 必须引用用户记录中的具体内容，不要问抽象的问题
2. 问题要具体、可回答，用户看完就知道该写什么
3. 如果用户有明确的今日目标，围绕目标完成情况提问
4. 如果用户没有目标，围绕今天最值得深入的一件事提问
5. 问题类型覆盖：事实补充（缺什么信息）、原因深挖（为什么）、推演（如果重来）、提炼（可复用什么）

好的问题示例：
- "你今天花最多时间在「重构认证模块」上，最大的卡点是什么？是怎么解决的？"
- "你说目标是完成重构，但实际只做了 80%，剩下 20% 是什么？为什么没做完？"
- "「和产品团队开会」这件事，你有什么收获？下次开会你会做什么不同的准备？"
- "今天修了 3 个 bug，这些 bug 有没有共同的根因？能不能从源头避免？"

不好的问题示例（不要这样问）：
- "你从今天的工作中学到了什么？"（太抽象）
- "你觉得今天的效率如何？"（无法具体回答）
- "有什么可以改进的地方？"（太宽泛）

直接返回问题列表，每行一个问题，不要有其他内容。`;
}

/** Build prompt for daily reflection using review framework */
export function buildReflectionPrompt(entry: Entry): string {
  const sections: string[] = [];

  if (entry.bullets.work.length > 0) {
    sections.push(`工作：\n${formatBulletText(entry.bullets.work)}`);
  }
  if (entry.bullets.study.length > 0) {
    sections.push(`学习：\n${formatBulletText(entry.bullets.study)}`);
  }
  if (entry.bullets.side.length > 0) {
    sections.push(`副业：\n${formatBulletText(entry.bullets.side)}`);
  }

  const reviewContext = [];
  if (entry.review?.target) reviewContext.push(`今日目标：${entry.review.target}`);
  if (entry.review?.gap) reviewContext.push(`差距分析：${entry.review.gap}`);
  if (entry.review?.reason) reviewContext.push(`原因分析：${entry.review.reason}`);
  if (entry.review?.whatIf) reviewContext.push(`推演思考：${entry.review.whatIf}`);
  if (entry.review?.lesson) reviewContext.push(`经验提炼：${entry.review.lesson}`);

  // Include guided question answers if available
  const qaContext = [];
  if (entry.ai?.questions && entry.ai?.questionAnswers) {
    for (let i = 0; i < entry.ai.questions.length; i++) {
      const question = entry.ai.questions[i];
      const answer = entry.ai.questionAnswers[i];
      if (question && answer?.trim()) {
        qaContext.push(`问：${question}\n答：${answer}`);
      }
    }
  }

  return `日期：${entry.date}

今日事项：
${sections.join('\n\n')}

${reviewContext.length > 0 ? '复盘内容：\n' + reviewContext.join('\n') : ''}

${qaContext.length > 0 ? '\n引导提问与回答：\n' + qaContext.join('\n\n') : ''}

请基于以上内容，写一段深度复盘总结。要求：

1. **不要用套话**，不要说"今天是充实的一天"、"收获满满"这样的话
2. **聚焦具体**，指出具体做了什么、学到了什么、有什么具体的观察
3. **挖掘原因**，分析为什么是这样的结果，而不是简单的描述
4. **提炼规律**，总结可以复用的经验或教训
5. **指向未来**，提出具体的改进建议

用一段话写完，简洁有力，不超过200字。`;
}

/** Build prompt for weekly summary */
export function buildWeekSummaryPrompt(entries: Entry[], weekStart: string): string {
  const daySummaries = entries.map((e) => {
    const bullets = [...e.bullets.work, ...e.bullets.study, ...e.bullets.side];
    if (bullets.length === 0) return `${e.date}：（无记录）`;
    const reviewNote = e.review?.lesson ? `\n经验：${e.review.lesson}` : '';
    return `${e.date}：\n${bullets.map((b) => `- ${b.text}`).join('\n')}${reviewNote}`;
  });

  return `本周起始日期：${weekStart}

${daySummaries.join('\n\n')}

请写一段结构化的周复盘。要求：

1. **回顾目标**：本周的核心目标是什么？（从内容推断）
2. **评估结果**：完成了什么？没完成什么？有什么意外收获？
3. **关键事件分析**：选择本周最重要的1-2件事深度分析
   - 事情经过
   - 决策点
   - 结果
   - 如果重来会怎么做
4. **规律提炼**：本周发现了什么规律或模式？
5. **下周调整**：基于本周复盘，下周要调整什么？

用清晰的结构输出，不要用套话。`;
}

/** Build prompt for project classification */
export function buildProjectClassificationPrompt(bullets: ClassifiableBullet[]): string {
  const bulletList = bullets.map((b) => `[${b.bulletId}]（${b.category}，${b.date}）：${b.text}`).join('\n');

  return `以下是工作日志中的要点，每个都有唯一ID：

${bulletList}

请将这些要点归类到不同的项目中。只返回如下格式的JSON：
{
  "projects": [
    {
      "name": "项目名称",
      "bulletIds": ["要点ID-1", "要点ID-2"]
    }
  ]
}

规则：
- 每个要点ID必须且只能出现在一个项目中
- 项目名称要简洁明了
- 根据内容和上下文将相关要点分组
- 只返回JSON，不要有其他内容`;
}

/** Build prompt for report generation */
export function buildReportGenerationPrompt(input: {
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  entries: Array<{ date: string; bullets: string[] }>;
  goals: Array<{ title: string; status: string }>;
  reviewCases: Array<{ title: string; conclusions: string[] }>;
  principles: Array<{ title: string; content: string }>;
}): string {
  const { title, period, startDate, endDate, entries, goals, reviewCases, principles } = input;

  const entriesText = entries.map((e) =>
    `${e.date}:\n${e.bullets.map((b) => `- ${b}`).join('\n')}`
  ).join('\n\n');

  const goalsText = goals.map((g) => `- ${g.title} (${g.status})`).join('\n');
  const reviewCasesText = reviewCases.map((rc) =>
    `### ${rc.title}\n${rc.conclusions.map((c) => `- ${c}`).join('\n')}`
  ).join('\n\n');
  const principlesText = principles.map((p) => `- ${p.title}: ${p.content}`).join('\n');

  return `请生成一份${period}报告。

## 报告信息
- 标题：${title}
- 时间：${startDate} ~ ${endDate}

## 期间记录
${entriesText || '暂无'}

## 目标
${goalsText || '暂无'}

## 复盘案例
${reviewCasesText || '暂无'}

## 原则库
${principlesText || '暂无'}

## 要求
1. 结构清晰，有明确的章节
2. 基于事实，不要泛泛而谈
3. 突出关键成果和改进点
4. 引用具体的复盘结论和原则
5. 提出下一步建议

请直接输出报告内容（Markdown 格式）。`;
}

/**
 * 经历线标题生成（批量）
 * 传入多条日期+原始记录，AI 为每条生成一个 10~20 字的中文标题。
 * 返回 JSON 数组：[{"date":"2026-06-13","title":"..."}]
 */
export function buildExperienceTitlePrompt(
  items: Array<{ date: string; bullets: string[]; reflection?: string }>,
): string {
  const lines = items.map((item) => {
    const bulletText = item.bullets.join('；');
    return `- 日期：${item.date}  内容：${bulletText}${item.reflection ? `  AI复盘：${item.reflection}` : ''}`;
  });

  return `你是一个个人成长经历提炼助手。下面是一组每日记录，请为每条记录生成一个 10~20 字的中文标题。

要求：
1. 标题要提炼当天最核心的事，不是泛泛而谈
2. 用主动语态，像在写日记的小标题（例如「搞定XX项目部署」「读完了XX这本书」）
3. 如果内容涉及具体项目/人名/技术，保留关键名词
4. 不要加书名号，不要超过 20 个字
5. 如果有 AI 复盘内容，标题应结合复盘结论而不仅是事项本身

请严格按以下 JSON 数组格式返回，不要有任何其他文字：
[{"date":"2026-06-13","title":"简洁标题"}]

记录：
${lines.join('\n')}`;
}

/**
 * 每日复盘 AI 自动填写
 * 输入当天的事项列表和用户填写的「今日目标」，AI 生成差距分析、原因分析、推演思考、经验提炼。
 * 返回 JSON：{"gap":"...","reason":"...","whatIf":"...","lesson":"..."}
 */
export function buildDailyReviewPrompt(input: {
  date: string;
  bullets: Array<{ category: string; text: string }>;
  target?: string;
}): string {
  const bulletLines = input.bullets.map((b) => `- [${b.category}] ${b.text}`).join('\n');

  return `你是一个每日复盘助手。用户今天记录了以下事项：

日期：${input.date}
${input.target ? `今日目标：${input.target}\n` : ''}
事项：
${bulletLines || '（无记录）'}

请根据以上内容，生成以下四个复盘字段。每个字段 1~3 句话，要求具体、务实、不说套话。

1. **差距分析**：今天实际做了什么 vs 目标（如果没有目标，就分析哪些事做得好、哪些不够好）
2. **原因分析**：产生差距的根本原因，不要停留在表面
3. **推演思考**：如果今天重来一次，具体会怎么做
4. **经验提炼**：从今天的经历中可以提炼出什么可复用的经验

请严格按以下 JSON 格式返回，不要有任何其他文字：
{"gap":"...","reason":"...","whatIf":"...","lesson":"..."}`;
}
