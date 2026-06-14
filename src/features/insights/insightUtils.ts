import type { Entry, Goal, Insight, ReviewCase, Principle } from '../../lib/schema';
import { createId } from '../../lib/ids';

interface InsightInput {
  entries: Record<string, Entry>;
  goals: Record<string, Goal>;
  reviewCases?: Record<string, ReviewCase>;
  principles?: Record<string, Principle>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Generate all insights for a period
 */
export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];

  // Always generate a summary if there's any data
  const summaryInsights = generateSummaryInsight(input);
  insights.push(...summaryInsights);

  insights.push(...generateActivityDistributionInsight(input));
  insights.push(...generateReviewQualityInsight(input));
  insights.push(...generateGoalDriftInsight(input));
  insights.push(...generateStalledThemeInsight(input));
  insights.push(...generateTagFrequencyInsight(input));
  insights.push(...generateConclusionsNeedingEvidenceInsight(input));
  insights.push(...generateWeakWhyDepthInsight(input));
  insights.push(...generateGoalsWithoutReviewInsight(input));

  return insights;
}

/**
 * Always generate a baseline summary insight when data exists
 */
export function generateSummaryInsight(input: InsightInput): Insight[] {
  const { entries, periodStart, periodEnd } = input;
  const periodEntries = Object.values(entries).filter(
    (e) => e.date >= periodStart && e.date <= periodEnd
  );

  if (periodEntries.length === 0) return [];

  const totalBullets = periodEntries.reduce(
    (sum, e) => sum + e.bullets.work.length + e.bullets.study.length + e.bullets.side.length,
    0
  );
  const reviewedDays = periodEntries.filter((e) => e.review && (
    e.review.target || e.review.gap || e.review.reason || e.review.lesson
  )).length;
  const daysWithBullets = periodEntries.filter(
    (e) => e.bullets.work.length + e.bullets.study.length + e.bullets.side.length > 0
  ).length;

  const summary = `本周期共 ${periodEntries.length} 天，${daysWithBullets} 天有记录，共 ${totalBullets} 条事项。其中 ${reviewedDays} 天进行了结构化复盘。`;

  const suggestions: string[] = [];
  if (daysWithBullets < periodEntries.length) {
    suggestions.push(`有 ${periodEntries.length - daysWithBullets} 天没有记录，建议保持每日打卡习惯。`);
  }
  if (reviewedDays === 0 && daysWithBullets > 0) {
    suggestions.push('有记录但没有复盘，建议展开复盘区域填写目标和差距分析。');
  }
  if (reviewedDays > 0 && reviewedDays < daysWithBullets) {
    suggestions.push(`${daysWithBullets - reviewedDays} 天有记录但未复盘，建议每天花 2 分钟填写复盘。`);
  }

  return [{
    id: createId(),
    type: 'activity-distribution',
    title: '本周期概览',
    summary: suggestions.length > 0 ? `${summary}\n${suggestions.join('\n')}` : summary,
    severity: 'info',
    periodStart,
    periodEnd,
    evidenceRefs: [],
    createdAt: new Date().toISOString(),
  }];
}

/**
 * Activity distribution insight
 */
export function generateActivityDistributionInsight(input: InsightInput): Insight[] {
  const { entries, periodStart, periodEnd } = input;
  const periodEntries = Object.values(entries).filter(
    (e) => e.date >= periodStart && e.date <= periodEnd
  );

  if (periodEntries.length === 0) return [];

  const counts = { work: 0, study: 0, side: 0 };
  for (const entry of periodEntries) {
    counts.work += entry.bullets.work.length;
    counts.study += entry.bullets.study.length;
    counts.side += entry.bullets.side.length;
  }

  const total = counts.work + counts.study + counts.side;
  if (total === 0) return [];

  const workPct = Math.round((counts.work / total) * 100);
  const sidePct = Math.round((counts.side / total) * 100);

  // Check for imbalance
  const insights: Insight[] = [];
  if (workPct > 80) {
    insights.push({
      id: createId(),
      type: 'activity-distribution',
      title: '工作占比过高',
      summary: `工作占 ${workPct}%，学习和副业空间不足。建议适当分配时间。`,
      severity: 'warning',
      periodStart,
      periodEnd,
      evidenceRefs: [],
      createdAt: new Date().toISOString(),
    });
  }

  if (sidePct > 50) {
    insights.push({
      id: createId(),
      type: 'activity-distribution',
      title: '副业投入较多',
      summary: `副业占 ${sidePct}%，超过一半精力。确认是否符合当前阶段重点。`,
      severity: 'info',
      periodStart,
      periodEnd,
      evidenceRefs: [],
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Review quality insight
 */
export function generateReviewQualityInsight(input: InsightInput): Insight[] {
  const { entries, periodStart, periodEnd } = input;
  const periodEntries = Object.values(entries).filter(
    (e) => e.date >= periodStart && e.date <= periodEnd
  );

  const reviewedDays = periodEntries.filter((e) => e.review && (
    e.review.target || e.review.gap || e.review.reason || e.review.lesson
  ));

  const qualities = reviewedDays
    .filter((e) => e.review?.quality)
    .map((e) => e.review!.quality!);

  if (qualities.length === 0) return [];

  const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;

  if (avgQuality < 3) {
    return [{
      id: createId(),
      type: 'review-quality',
      title: '复盘质量偏低',
      summary: `平均复盘质量 ${avgQuality.toFixed(1)}/5。建议更深入地分析原因和提炼经验。`,
      severity: 'warning',
      periodStart,
      periodEnd,
      evidenceRefs: [],
      createdAt: new Date().toISOString(),
    }];
  }

  return [];
}

/**
 * Goal drift insight
 */
export function generateGoalDriftInsight(input: InsightInput): Insight[] {
  const { goals, periodStart, periodEnd } = input;
  const activeGoals = Object.values(goals).filter(
    (g) => g.status === 'active' && g.startDate >= periodStart && g.endDate <= periodEnd
  );

  const insights: Insight[] = [];

  for (const goal of activeGoals) {
    // Check if any linked bullets exist
    if (goal.linkedBullets.length === 0) {
      insights.push({
        id: createId(),
        type: 'goal-drift',
        title: `目标"${goal.title}"缺少推进`,
        summary: `该目标没有关联任何工作记录，可能已经偏离或停滞。`,
        severity: 'warning',
        periodStart,
        periodEnd,
        evidenceRefs: [],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Stalled theme insight
 */
export function generateStalledThemeInsight(input: InsightInput): Insight[] {
  const { entries, periodStart, periodEnd } = input;
  const periodEntries = Object.values(entries).filter(
    (e) => e.date >= periodStart && e.date <= periodEnd
  );

  // Collect all projects/themes
  const themeLastSeen = new Map<string, string>();
  for (const entry of periodEntries) {
    if (entry.ai?.projects) {
      for (const project of entry.ai.projects) {
        const current = themeLastSeen.get(project.name);
        if (!current || entry.date > current) {
          themeLastSeen.set(project.name, entry.date);
        }
      }
    }
  }

  const insights: Insight[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const [theme, lastSeen] of themeLastSeen) {
    const daysSinceLastSeen = Math.floor(
      (new Date(today).getTime() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSeen > 7) {
      insights.push({
        id: createId(),
        type: 'stalled-theme',
        title: `主题"${theme}"已停滞`,
        summary: `该主题 ${daysSinceLastSeen} 天没有新进展。确认是否需要重新激活。`,
        severity: 'info',
        periodStart,
        periodEnd,
        evidenceRefs: [],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Tag frequency insight
 */
export function generateTagFrequencyInsight(input: InsightInput): Insight[] {
  const { entries, periodStart, periodEnd } = input;
  const periodEntries = Object.values(entries).filter(
    (e) => e.date >= periodStart && e.date <= periodEnd
  );

  const tagCounts: Record<string, number> = {};
  for (const entry of periodEntries) {
    if (entry.review?.tags) {
      for (const tag of entry.review.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  const insights: Insight[] = [];

  // Check for recurring failures
  if ((tagCounts['failure'] || 0) >= 3) {
    insights.push({
      id: createId(),
      type: 'recurring-problem',
      title: '反复出现失败教训',
      summary: `本周期内 ${tagCounts['failure']} 次记录了失败教训。建议深入分析根因。`,
      severity: 'warning',
      periodStart,
      periodEnd,
      evidenceRefs: [],
      createdAt: new Date().toISOString(),
    });
  }

  // Check for success patterns
  if ((tagCounts['success'] || 0) >= 3) {
    insights.push({
      id: createId(),
      type: 'success-pattern',
      title: '积累成功经验',
      summary: `本周期内 ${tagCounts['success']} 次记录了成功经验。可以总结可复用的模式。`,
      severity: 'info',
      periodStart,
      periodEnd,
      evidenceRefs: [],
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Conclusions needing evidence insight
 */
export function generateConclusionsNeedingEvidenceInsight(input: InsightInput): Insight[] {
  const { reviewCases, periodStart, periodEnd } = input;
  if (!reviewCases) return [];

  const periodCases = Object.values(reviewCases).filter(
    (rc) => rc.startDate >= periodStart && rc.endDate <= periodEnd
  );

  const insights: Insight[] = [];

  for (const rc of periodCases) {
    const needsEvidence = rc.conclusions.filter(
      (c) => c.quality.verdict === 'needs-evidence'
    );

    if (needsEvidence.length > 0) {
      insights.push({
        id: createId(),
        type: 'recurring-problem',
        title: `复盘"${rc.title}"有结论需要补证据`,
        summary: `${needsEvidence.length} 条结论缺少交叉验证。建议补充证据以提高结论可信度。`,
        severity: 'warning',
        periodStart,
        periodEnd,
        evidenceRefs: [],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Weak why depth insight
 */
export function generateWeakWhyDepthInsight(input: InsightInput): Insight[] {
  const { reviewCases, periodStart, periodEnd } = input;
  if (!reviewCases) return [];

  const periodCases = Object.values(reviewCases).filter(
    (rc) => rc.startDate >= periodStart && rc.endDate <= periodEnd
  );

  const insights: Insight[] = [];

  for (const rc of periodCases) {
    const maxWhyDepth = rc.steps.causeAnalysis.whys.length > 0
      ? Math.max(...rc.steps.causeAnalysis.whys.map((w) => w.depth))
      : 0;

    if (maxWhyDepth > 0 && maxWhyDepth < 3) {
      insights.push({
        id: createId(),
        type: 'review-quality',
        title: `复盘"${rc.title}"追问深度不足`,
        summary: `Why 追问只到第 ${maxWhyDepth} 层，建议至少追问到第 3 层以发现根因。`,
        severity: 'info',
        periodStart,
        periodEnd,
        evidenceRefs: [],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Goals without review insight
 */
export function generateGoalsWithoutReviewInsight(input: InsightInput): Insight[] {
  const { goals, reviewCases, periodStart, periodEnd } = input;
  if (!reviewCases) return [];

  const activeGoals = Object.values(goals).filter(
    (g) => g.status === 'active' && g.startDate >= periodStart && g.endDate <= periodEnd
  );

  const reviewCaseGoalIds = new Set(
    Object.values(reviewCases).flatMap((rc) => rc.linkedGoalIds)
  );

  const insights: Insight[] = [];

  for (const goal of activeGoals) {
    if (!reviewCaseGoalIds.has(goal.id)) {
      insights.push({
        id: createId(),
        type: 'goal-drift',
        title: `目标"${goal.title}"缺少复盘`,
        summary: '该目标没有关联任何复盘案例，建议定期复盘目标进展。',
        severity: 'info',
        periodStart,
        periodEnd,
        evidenceRefs: [],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}
