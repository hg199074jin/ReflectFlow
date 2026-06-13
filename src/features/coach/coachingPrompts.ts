import type { Entry, WeeklyReview, Goal } from '../../lib/schema';
import { formatBulletText } from '../../lib/text';

/**
 * Build daily coaching prompt
 */
export function buildDailyCoachPrompt(entry: Entry): string {
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
  if (entry.review?.lesson) reviewContext.push(`经验提炼：${entry.review.lesson}`);

  return `日期：${entry.date}

今日事项：
${sections.join('\n\n')}

${reviewContext.length > 0 ? '复盘内容：\n' + reviewContext.join('\n') : ''}

你是一个复盘教练。根据以上内容，生成 3-5 个深度追问，帮助用户发现问题根因。

问题应该：
1. 追问"为什么"，而不是停留在表面
2. 挑战用户的假设和思维定式
3. 引导用户思考不同角度
4. 帮助用户发现潜在的模式和规律
5. 引导用户思考具体的改进行动

直接返回问题列表，每行一个问题，不要有其他内容。`;
}

/**
 * Build weekly coaching prompt
 */
export function buildWeeklyCoachPrompt(
  weeklyReview: WeeklyReview,
  _entries: Entry[],
  goals: Goal[],
): string {
  const activeGoals = goals.filter((g) => g.status === 'active');

  return `本周复盘：
周期：${weeklyReview.weekStart}

本周完成：
${weeklyReview.completed || '未填写'}

未完成：
${weeklyReview.notCompleted || '未填写'}

关键事件：
${weeklyReview.keyEvent || '未填写'}

规律提炼：
${weeklyReview.pattern || '未填写'}

本周目标：
${activeGoals.map((g) => `- ${g.title}`).join('\n') || '无'}

你是一个复盘教练。根据以上内容，生成 3-5 个深度追问。

问题应该：
1. 追问关键事件的根因
2. 挑战"完成"和"未完成"的真实原因
3. 帮助用户发现本周的模式
4. 引导用户思考下周的调整
5. 连接到目标，检查是否偏离

直接返回问题列表，每行一个问题，不要有其他内容。`;
}
