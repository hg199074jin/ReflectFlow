import type { Entry, ReviewCase, PreviewPlan, Principle } from '../../lib/schema';
import {
  REVIEW_CASE_TYPE_LABELS,
  REVIEW_CASE_STATUS_LABELS,
  DEVIATION_STATUS_LABELS,
  CONTROLLABILITY_LABELS,
  ACTION_MODE_LABELS,
  QUALITY_VERDICT_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '../../lib/schema';

/** Serialize an Entry to Markdown format */
export function entryToMarkdown(entry: Entry, opts: { includeAI: boolean }): string {
  const lines: string[] = [`# ${entry.date}`, ''];

  // Work
  if (entry.bullets.work.length > 0) {
    lines.push('## Work');
    for (const b of entry.bullets.work) {
      lines.push(`- ${b.text}`);
    }
    lines.push('');
  }

  // Study
  if (entry.bullets.study.length > 0) {
    lines.push('## Study');
    for (const b of entry.bullets.study) {
      lines.push(`- ${b.text}`);
    }
    lines.push('');
  }

  // Side
  if (entry.bullets.side.length > 0) {
    lines.push('## Side');
    for (const b of entry.bullets.side) {
      lines.push(`- ${b.text}`);
    }
    lines.push('');
  }

  // AI sections
  if (opts.includeAI && entry.ai) {
    if (entry.ai.reflection) {
      lines.push('## Reflection (AI)');
      lines.push(`> ${entry.ai.reflection}`);
      lines.push('');
    }
    if (entry.ai.weekSummary) {
      lines.push('## Week Summary (AI)');
      lines.push(`> ${entry.ai.weekSummary.content}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/** Get the export file path for an entry */
export function entryExportPath(entry: Entry, folderStructure: 'flat' | 'year-month'): string {
  if (folderStructure === 'flat') {
    return `journal/${entry.date}.md`;
  }
  const [year, month] = entry.date.split('-');
  return `journal/${year}/${month}/${entry.date}.md`;
}

/** Serialize a ReviewCase to Markdown format */
export function reviewCaseToMarkdown(reviewCase: ReviewCase): string {
  const lines: string[] = [
    `# ${reviewCase.title}`,
    '',
    `**类型：** ${REVIEW_CASE_TYPE_LABELS[reviewCase.type]}`,
    `**状态：** ${REVIEW_CASE_STATUS_LABELS[reviewCase.status]}`,
    `**时间：** ${reviewCase.startDate} ~ ${reviewCase.endDate}`,
    '',
  ];

  // Process step
  if (reviewCase.steps.process.timelineNotes || reviewCase.steps.process.keyFacts.length > 0) {
    lines.push('## 梳理过程', '');
    if (reviewCase.steps.process.timelineNotes) {
      lines.push(reviewCase.steps.process.timelineNotes, '');
    }
    if (reviewCase.steps.process.keyFacts.length > 0) {
      lines.push('**关键事实：**');
      for (const fact of reviewCase.steps.process.keyFacts) {
        lines.push(`- [${fact.date}] ${fact.text}`);
      }
      lines.push('');
    }
    if (reviewCase.steps.process.missingFacts.length > 0) {
      lines.push('**缺失事实：**');
      for (const fact of reviewCase.steps.process.missingFacts) {
        lines.push(`- ${fact}`);
      }
      lines.push('');
    }
  }

  // Expectation step
  const { expectation } = reviewCase.steps;
  if (expectation.purpose || expectation.goals.length > 0) {
    lines.push('## 回顾目标', '');
    if (expectation.purpose) {
      lines.push(`**目的：** ${expectation.purpose}`, '');
    }
    if (expectation.goals.length > 0) {
      lines.push('**目标：**');
      for (const goal of expectation.goals) {
        lines.push(`- ${goal}`);
      }
      lines.push('');
    }
    if (expectation.measures.length > 0) {
      lines.push('**举措：**');
      for (const measure of expectation.measures) {
        lines.push(`- ${measure}`);
      }
      lines.push('');
    }
  }

  // Evaluation step
  if (reviewCase.steps.evaluation.rows.length > 0) {
    lines.push('## 评估结果', '');
    lines.push('| 层次 | 预期 | 结果 | 偏差 | 状态 |');
    lines.push('|------|------|------|------|------|');
    for (const row of reviewCase.steps.evaluation.rows) {
      const levelLabel = row.level === 'purpose' ? '目的' : row.level === 'goal' ? '目标' : '举措';
      lines.push(`| ${levelLabel} | ${row.expectation} | ${row.result} | ${row.deviation} | ${DEVIATION_STATUS_LABELS[row.status]} |`);
    }
    lines.push('');
  }

  // Cause analysis step
  const { causeAnalysis } = reviewCase.steps;
  if (causeAnalysis.whys.length > 0 || causeAnalysis.controllability.length > 0) {
    lines.push('## 分析原因', '');
    if (causeAnalysis.whys.length > 0) {
      lines.push('**Why 追问链：**');
      for (const why of causeAnalysis.whys) {
        const indent = '  '.repeat(why.depth - 1);
        lines.push(`${indent}Q: ${why.question}`);
        lines.push(`${indent}A: ${why.answer}`);
      }
      lines.push('');
    }
    if (causeAnalysis.controllability.length > 0) {
      lines.push('**可控性分析：**');
      for (const item of causeAnalysis.controllability) {
        lines.push(`- ${item.title} (${CONTROLLABILITY_LABELS[item.controllability]})`);
      }
      lines.push('');
    }
  }

  // Learning step
  const { learning } = reviewCase.steps;
  if (learning.insights.length > 0 || learning.rules.length > 0) {
    lines.push('## 总结经验', '');
    if (learning.insights.length > 0) {
      lines.push('**洞察：**');
      for (const insight of learning.insights) {
        lines.push(`- ${insight}`);
      }
      lines.push('');
    }
    if (learning.rules.length > 0) {
      lines.push('**规律：**');
      for (const rule of learning.rules) {
        lines.push(`- ${rule}`);
      }
      lines.push('');
    }
  }

  // Conclusions
  if (reviewCase.conclusions.length > 0) {
    lines.push('## 结论', '');
    for (const conclusion of reviewCase.conclusions) {
      lines.push(`### ${conclusion.title}`);
      lines.push(conclusion.content);
      lines.push(`**质量：** ${conclusion.quality.score}分 - ${QUALITY_VERDICT_LABELS[conclusion.quality.verdict]}`);
      if (conclusion.boundary) {
        lines.push(`**边界：** ${conclusion.boundary}`);
      }
      lines.push('');
    }
  }

  // Action items
  if (reviewCase.actionItems.length > 0) {
    lines.push('## 行动计划', '');
    for (const action of reviewCase.actionItems) {
      const status = action.completed ? '✓' : '○';
      lines.push(`- [${status}] [${ACTION_MODE_LABELS[action.mode]}] ${action.title}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Serialize a PreviewPlan to Markdown format */
export function previewPlanToMarkdown(plan: PreviewPlan): string {
  const lines: string[] = [
    `# ${plan.title}`,
    '',
    `**时间：** ${plan.startDate} ~ ${plan.endDate}`,
    '',
  ];

  if (plan.purpose) {
    lines.push('## 目的', plan.purpose, '');
  }

  if (plan.goals.length > 0) {
    lines.push('## 目标');
    for (const goal of plan.goals) {
      lines.push(`- ${goal}`);
    }
    lines.push('');
  }

  if (plan.strategies.length > 0) {
    lines.push('## 策略');
    for (const strategy of plan.strategies) {
      lines.push(`- ${strategy}`);
    }
    lines.push('');
  }

  if (plan.assumptions.length > 0) {
    lines.push('## 假设');
    for (const assumption of plan.assumptions) {
      lines.push(`- ${assumption}`);
    }
    lines.push('');
  }

  if (plan.risks.length > 0) {
    lines.push('## 风险');
    for (const risk of plan.risks) {
      lines.push(`- ${risk}`);
    }
    lines.push('');
  }

  if (plan.contingencies.length > 0) {
    lines.push('## 预案');
    for (const contingency of plan.contingencies) {
      lines.push(`- ${contingency}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Serialize a Principle to Markdown format */
export function principleToMarkdown(principle: Principle): string {
  const lines: string[] = [
    `# ${principle.title}`,
    '',
    principle.content,
    '',
    `**验证状态：** ${VERIFICATION_STATUS_LABELS[principle.verificationStatus]}`,
  ];

  if (principle.applicableContexts.length > 0) {
    lines.push('', '## 适用场景');
    for (const context of principle.applicableContexts) {
      lines.push(`- ${context}`);
    }
  }

  if (principle.boundaries.length > 0) {
    lines.push('', '## 边界条件');
    for (const boundary of principle.boundaries) {
      lines.push(`- ${boundary}`);
    }
  }

  lines.push('', `*创建于 ${principle.createdAt.slice(0, 10)}*`);

  return lines.join('\n');
}

/** Get export file path for review case */
export function reviewCaseExportPath(reviewCase: ReviewCase): string {
  return `review-cases/${reviewCase.id}.md`;
}

/** Get export file path for preview plan */
export function previewPlanExportPath(plan: PreviewPlan): string {
  return `preview-plans/${plan.id}.md`;
}

/** Get export file path for principle */
export function principleExportPath(principle: Principle): string {
  return `principles/${principle.id}.md`;
}
