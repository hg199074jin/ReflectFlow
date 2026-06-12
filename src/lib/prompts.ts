import type { Entry, ClassifiableBullet } from './schema';
import { formatBulletText } from './text';

/** Build prompt for daily reflection */
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

  return `日期：${entry.date}

今日事项：
${sections.join('\n\n')}

请用一段话总结今天的收获和观察。简明扼要，重点突出完成了什么、学到了什么、有什么值得注意的地方。不要用套话，写得实在一点。`;
}

/** Build prompt for weekly summary */
export function buildWeekSummaryPrompt(entries: Entry[], weekStart: string): string {
  const daySummaries = entries.map((e) => {
    const bullets = [...e.bullets.work, ...e.bullets.study, ...e.bullets.side];
    if (bullets.length === 0) return `${e.date}：（无记录）`;
    return `${e.date}：\n${bullets.map((b) => `- ${b.text}`).join('\n')}`;
  });

  return `本周起始日期：${weekStart}

${daySummaries.join('\n\n')}

请写一段结构化的周总结。列出本周主要成果、发现的规律、以及可以改进的地方。简洁明了。`;
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
