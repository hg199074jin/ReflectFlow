import type { Goal, GoalPlan, GoalFinalReport, DailyGoalTarget } from '../lib/schema';

export function exportGoalAsMarkdown(
  goal: Goal,
  plan?: GoalPlan,
  reports?: GoalFinalReport[],
  dailyTargets?: DailyGoalTarget[],
): string {
  let md = `# ${goal.title}\n\n`;

  // 基础信息
  md += `## 基础信息\n\n`;
  md += `- **状态**: ${goal.status}\n`;
  md += `- **优先级**: ${goal.priority ?? '未设置'}\n`;
  md += `- **开始日期**: ${goal.startDate}\n`;
  md += `- **结束日期**: ${goal.endDate}\n`;
  if (goal.currentState) md += `- **当前起点**: ${goal.currentState}\n`;
  if (goal.desiredOutcome) md += `- **期望结果**: ${goal.desiredOutcome}\n`;
  if (goal.availableTime) md += `- **可投入时间**: ${goal.availableTime}\n`;
  md += '\n';

  // 目标定义
  if (goal.successCriteria?.length || goal.constraints?.length || goal.risks?.length) {
    md += `## 目标定义\n\n`;
    if (goal.successCriteria?.length) {
      md += `### 成功标准\n\n`;
      goal.successCriteria.forEach(c => { md += `- ${c}\n`; });
      md += '\n';
    }
    if (goal.constraints?.length) {
      md += `### 约束条件\n\n`;
      goal.constraints.forEach(c => { md += `- ${c}\n`; });
      md += '\n';
    }
    if (goal.risks?.length) {
      md += `### 风险点\n\n`;
      goal.risks.forEach(r => { md += `- ${r}\n`; });
      md += '\n';
    }
    if (goal.acceptanceMethod) {
      md += `### 验收方式\n\n${goal.acceptanceMethod}\n\n`;
    }
  }

  // 阶段里程碑
  if (plan?.milestones?.length) {
    md += `## 阶段里程碑\n\n`;
    plan.milestones.forEach(m => {
      md += `### ${m.title}\n\n`;
      md += `- **时间**: ${m.startDate} 至 ${m.endDate}\n`;
      md += `- **预期产出**: ${m.expectedOutput}\n`;
      if (m.description) md += `- **描述**: ${m.description}\n`;
      md += '\n';
    });
  }

  // 每日目标
  if (dailyTargets?.length) {
    md += `## 每日目标\n\n`;
    dailyTargets.forEach(t => {
      md += `### ${t.date}\n\n`;
      md += `- **计划任务**: ${t.plannedTask}\n`;
      md += `- **最低标准**: ${t.minimumStandard}\n`;
      md += `- **预期产出**: ${t.expectedOutput}\n`;
      md += `- **状态**: ${t.status}\n`;
      if (t.actualProgress) md += `- **实际进度**: ${t.actualProgress}\n`;
      if (t.gap) md += `- **差距**: ${t.gap}\n`;
      md += '\n';
    });
  }

  // 结案报告
  if (reports?.length) {
    reports.forEach(r => {
      md += `## 结案报告: ${r.title}\n\n`;
      md += `### 原始目标\n\n${r.originalGoal}\n\n`;
      md += `### 最终结果\n\n${r.finalOutcome}\n\n`;
      md += `### 完成程度\n\n${r.completionLevel}\n\n`;
      if (r.keyActions?.length) {
        md += `### 关键行动\n\n`;
        r.keyActions.forEach(a => { md += `- ${a}\n`; });
        md += '\n';
      }
      if (r.principles?.length) {
        md += `### 沉淀原则\n\n`;
        r.principles.forEach(p => { md += `- ${p}\n`; });
        md += '\n';
      }
      if (r.nextTimeSuggestions?.length) {
        md += `### 下次建议\n\n`;
        r.nextTimeSuggestions.forEach(s => { md += `- ${s}\n`; });
        md += '\n';
      }
    });
  }

  return md;
}
