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

  const reviewContext = entry.review?.target
    ? `\n今日目标：${entry.review.target}`
    : '';

  return `日期：${entry.date}

今日事项：
${sections.join('\n\n')}${reviewContext}

请根据以上内容，生成3-5个引导深度思考的问题。这些问题应该帮助用户进行复盘，而不是简单的总结。

问题应该：
1. 引导用户思考"为什么"而不仅仅是"是什么"
2. 帮助用户发现潜在的规律和模式
3. 引导用户进行推演（如果重来会怎样）
4. 帮助用户提炼可复用的经验

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

  return `日期：${entry.date}

今日事项：
${sections.join('\n\n')}

${reviewContext.length > 0 ? '复盘内容：\n' + reviewContext.join('\n') : ''}

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
