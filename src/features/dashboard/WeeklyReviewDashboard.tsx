import { useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { toDateKey, getWeekRange } from '../../lib/date';
import { getGoalStatusColor, getGoalStatusLabel } from '../goals/goalUtils';
import { GAP_REASON_LABELS } from '../../lib/schema';
import type { Entry } from '../../lib/schema';

export function WeeklyReviewDashboard() {
  const goals = useTimelineStore((s) => s.goals);
  const entries = useTimelineStore((s) => s.entries);
  const dailyGoalTargets = useTimelineStore((s) => s.dailyGoalTargets);
  const insights = useTimelineStore((s) => s.insights);
  const principles = useTimelineStore((s) => s.principles);
  const weeklyReviews = useTimelineStore((s) => s.weeklyReviews);

  const today = toDateKey(new Date());
  const weekRange = getWeekRange(today);

  // 1. This week's goals (active goals that overlap with the week)
  const weekGoals = useMemo(() => {
    return Object.values(goals).filter(
      (g) =>
        g.status === 'active' &&
        g.startDate <= weekRange.end &&
        g.endDate >= weekRange.start,
    );
  }, [goals, weekRange]);

  // 2. This week's entries summary (reactive to entry changes)
  const weekEntries = useMemo(() => {
    return Object.values(entries).filter(
      (e: Entry) => e.date >= weekRange.start && e.date <= weekRange.end,
    );
  }, [entries, weekRange]);

  const entrySummary = useMemo(() => {
    const totalDays = weekEntries.length;
    const reviewDays = weekEntries.filter(
      (e) =>
        e.review &&
        (e.review.target || e.review.gap || e.review.reason || e.review.lesson),
    ).length;
    const totalBullets = weekEntries.reduce(
      (sum, e) =>
        sum +
        e.bullets.work.length +
        e.bullets.study.length +
        e.bullets.side.length,
      0,
    );
    return { totalDays, reviewDays, totalBullets };
  }, [weekEntries]);

  // 3. Daily target completion stats
  const weekTargets = useMemo(() => {
    return Object.values(dailyGoalTargets).filter(
      (t) => t.date >= weekRange.start && t.date <= weekRange.end,
    );
  }, [dailyGoalTargets, weekRange]);

  const completionStats = useMemo(() => {
    const completed = weekTargets.filter((t) => t.status === 'completed').length;
    const missed = weekTargets.filter((t) => t.status === 'missed').length;
    const adjusted = weekTargets.filter((t) => t.status === 'adjusted').length;
    const pending = weekTargets.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
    const total = weekTargets.length;
    return { completed, missed, adjusted, pending, total };
  }, [weekTargets]);

  // 4. Main deviations (gap reasons)
  const deviations = useMemo(() => {
    const withGap = weekTargets.filter(
      (t) => (t.gap && t.gap.length > 0) || (t.gapReasons && t.gapReasons.length > 0),
    );
    return withGap.map((t) => ({
      date: t.date,
      task: t.plannedTask,
      gap: t.gap ?? '',
      reasons: (t.gapReasons ?? []).map((r) => GAP_REASON_LABELS[r] ?? r),
    }));
  }, [weekTargets]);

  // 5. AI insights for this week
  const weekInsights = useMemo(() => {
    return Object.values(insights).filter(
      (i) => i.periodStart >= weekRange.start && i.periodEnd <= weekRange.end,
    );
  }, [insights, weekRange]);

  // 6. Principles created this week
  const weekPrinciples = useMemo(() => {
    return Object.values(principles).filter(
      (p) => p.createdAt >= weekRange.start && p.createdAt <= weekRange.end,
    );
  }, [principles, weekRange]);

  // 7. Next week suggestions
  const nextWeekSuggestions = useMemo(() => {
    // Get the most recent weekly review's suggestions
    const allReviews = Object.values(weeklyReviews);
    if (allReviews.length === 0) return [];
    const sorted = [...allReviews].sort((a, b) =>
      b.weekStart.localeCompare(a.weekStart),
    );
    const latest = sorted[0];
    if (!latest?.adjustment) return [];
    // Parse adjustment text into individual suggestions
    return latest.adjustment
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [weeklyReviews]);

  return (
    <div className="weekly-dashboard">
      <div className="weekly-dashboard-header">
        <h2 className="weekly-dashboard-title">我的一周复盘</h2>
        <p className="weekly-dashboard-subtitle">
          {weekRange.start} ~ {weekRange.end}
        </p>
      </div>

      <div className="weekly-dashboard-sections">
        {/* Section 1: This week's goals */}
        <section className="weekly-dashboard-section">
          <h3>本周目标</h3>
          {weekGoals.length === 0 ? (
            <p className="weekly-dashboard-empty">本周暂无活跃目标</p>
          ) : (
            <ul className="weekly-dashboard-list">
              {weekGoals.map((g) => (
                <li key={g.id}>
                  <div className="weekly-dashboard-goal-item">
                    <span
                      className="weekly-dashboard-goal-dot"
                      style={{ backgroundColor: getGoalStatusColor(g.status) }}
                    />
                    <span>
                      {g.title}{' '}
                      <small style={{ color: 'var(--color-text-muted)' }}>
                        ({getGoalStatusLabel(g.status)})
                      </small>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Section 2: Entry summary */}
        <section className="weekly-dashboard-section">
          <h3>本周每日记录摘要</h3>
          {entrySummary.totalDays === 0 ? (
            <p className="weekly-dashboard-empty">本周暂无记录</p>
          ) : (
            <div className="weekly-dashboard-stats">
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {entrySummary.totalDays}
                </span>
                <span className="weekly-dashboard-stat-label">记录天数</span>
              </div>
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {entrySummary.totalBullets}
                </span>
                <span className="weekly-dashboard-stat-label">记录条数</span>
              </div>
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {entrySummary.reviewDays}
                </span>
                <span className="weekly-dashboard-stat-label">复盘天数</span>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Target completion */}
        <section className="weekly-dashboard-section">
          <h3>本周每日目标完成情况</h3>
          {completionStats.total === 0 ? (
            <p className="weekly-dashboard-empty">本周暂无每日目标</p>
          ) : (
            <div className="weekly-dashboard-stats">
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {completionStats.completed}
                </span>
                <span className="weekly-dashboard-stat-label">已完成</span>
              </div>
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {completionStats.missed}
                </span>
                <span className="weekly-dashboard-stat-label">未完成</span>
              </div>
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {completionStats.adjusted}
                </span>
                <span className="weekly-dashboard-stat-label">已调整</span>
              </div>
              <div className="weekly-dashboard-stat">
                <span className="weekly-dashboard-stat-value">
                  {completionStats.total}
                </span>
                <span className="weekly-dashboard-stat-label">总计</span>
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Main deviations */}
        <section className="weekly-dashboard-section">
          <h3>本周主要偏差</h3>
          {deviations.length === 0 ? (
            <p className="weekly-dashboard-empty">本周暂无偏差记录</p>
          ) : (
            <div>
              {deviations.map((d, i) => (
                <div key={i} className="weekly-dashboard-deviation">
                  <strong>{d.date}</strong>: {d.task}
                  {d.gap && (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {' '}
                      — 差距: {d.gap}
                    </span>
                  )}
                  {d.reasons.length > 0 && (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {' '}
                      ({d.reasons.join(', ')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 5: AI insights */}
        <section className="weekly-dashboard-section">
          <h3>本周 AI 洞察</h3>
          {weekInsights.length === 0 ? (
            <p className="weekly-dashboard-empty">本周暂无 AI 洞察</p>
          ) : (
            <div>
              {weekInsights.map((insight) => (
                <div key={insight.id} className="weekly-dashboard-insight">
                  <strong>{insight.title}</strong>
                  <p>{insight.summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 6: Principles this week */}
        <section className="weekly-dashboard-section">
          <h3>本周沉淀原则</h3>
          {weekPrinciples.length === 0 ? (
            <p className="weekly-dashboard-empty">本周暂无新原则沉淀</p>
          ) : (
            <div>
              {weekPrinciples.map((p) => (
                <div key={p.id} className="weekly-dashboard-principle">
                  <strong>{p.title}</strong>
                  <p>{p.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 7: Next week suggestions */}
        <section className="weekly-dashboard-section">
          <h3>下周建议行动</h3>
          {nextWeekSuggestions.length === 0 ? (
            <p className="weekly-dashboard-empty">
              暂无下周建议，完成本周复盘后可获取 AI 建议
            </p>
          ) : (
            <ul className="weekly-dashboard-list">
              {nextWeekSuggestions.map((s, i) => (
                <li key={i} className="weekly-dashboard-suggestion">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
