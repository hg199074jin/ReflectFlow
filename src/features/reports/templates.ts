import type { ReportTemplate } from '../../lib/schema';

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'boss-weekly',
    name: '给老板的周报',
    period: 'week',
    description: '简洁专业的周报，突出成果和下周计划',
    sections: [
      { id: 'summary', title: '本周概要' },
      { id: 'achievements', title: '主要成果' },
      { id: 'challenges', title: '遇到的问题' },
      { id: 'next-week', title: '下周计划' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'partner-monthly',
    name: '给合伙人的月度复盘',
    period: 'month',
    description: '深度复盘，包含目标达成和趋势分析',
    sections: [
      { id: 'overview', title: '月度概览' },
      { id: 'goals', title: '目标达成情况' },
      { id: 'insights', title: '关键洞察' },
      { id: 'adjustments', title: '下月调整' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'personal-deep',
    name: '个人深度复盘',
    period: 'month',
    description: '面向自己的深度反思，挖掘根因和模式',
    sections: [
      { id: 'reflection', title: '整体反思' },
      { id: 'patterns', title: '发现的模式' },
      { id: 'lessons', title: '经验教训' },
      { id: 'growth', title: '成长点' },
      { id: 'next', title: '下一步行动' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'goal-review',
    name: '目标完成复盘',
    period: 'month',
    description: '专注于目标达成情况的复盘',
    sections: [
      { id: 'goal-status', title: '目标状态' },
      { id: 'progress', title: '进展分析' },
      { id: 'blockers', title: '阻碍因素' },
      { id: 'adjustments', title: '目标调整建议' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'theme-progress',
    name: '工作主题推进报告',
    period: 'month',
    description: '按工作主题梳理进展',
    sections: [
      { id: 'themes', title: '主题概览' },
      { id: 'progress', title: '各主题进展' },
      { id: 'stalled', title: '停滞主题' },
      { id: 'recommendations', title: '建议' },
    ],
    requiresEvidence: true,
  },
  // Plus Review Method Templates
  {
    id: 'structured-weekly-review',
    name: '结构化周复盘',
    period: 'week',
    description: '基于五步法的深度周复盘',
    sections: [
      { id: 'process', title: '梳理过程' },
      { id: 'expectation', title: '回顾目标' },
      { id: 'evaluation', title: '评估结果' },
      { id: 'cause-analysis', title: '分析原因' },
      { id: 'learning', title: '总结经验' },
      { id: 'actions', title: '行动计划' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'five-step-monthly-review',
    name: '五步法月度复盘',
    period: 'month',
    description: '基于沈磊五步法的月度深度复盘',
    sections: [
      { id: 'overview', title: '月度概览' },
      { id: 'key-events', title: '关键事件复盘' },
      { id: 'deviation-matrix', title: '偏差矩阵' },
      { id: 'principles', title: '沉淀原则' },
      { id: 'next-month', title: '下月推演' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'goal-deviation-review',
    name: '目标偏差复盘',
    period: 'month',
    description: '专注于目标偏差分析的复盘',
    sections: [
      { id: 'goal-summary', title: '目标汇总' },
      { id: 'deviation-analysis', title: '偏差分析' },
      { id: 'root-causes', title: '根因分析' },
      { id: 'corrections', title: '纠偏措施' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'principle-digest',
    name: '原则库摘要',
    period: 'month',
    description: '总结本月沉淀的原则和洞察',
    sections: [
      { id: 'new-principles', title: '新增原则' },
      { id: 'validated-principles', title: '已验证原则' },
      { id: 'insights', title: '关键洞察' },
      { id: 'applications', title: '应用场景' },
    ],
    requiresEvidence: true,
  },
  {
    id: 'preview-vs-result',
    name: '事前推演 vs 实际结果',
    period: 'month',
    description: '对比事前沙盘与实际执行结果',
    sections: [
      { id: 'preview-summary', title: '事前推演回顾' },
      { id: 'actual-results', title: '实际结果' },
      { id: 'deviations', title: '偏差分析' },
      { id: 'lessons', title: '经验教训' },
    ],
    requiresEvidence: true,
  },
];

export function getReportTemplate(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesForPeriod(period: 'week' | 'month'): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.period === period);
}
