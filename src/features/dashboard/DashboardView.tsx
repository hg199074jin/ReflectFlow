import { useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { toDateKey, getWeekRange } from '../../lib/date';
import { detectGoalRisk, getGoalStatusColor } from '../goals/goalUtils';
import { GAP_REASON_LABELS } from '../../lib/schema';
import type { Goal, GapReason } from '../../lib/schema';

export function DashboardView() {
  const goals = useTimelineStore((s) => s.goals);
  const dailyGoalTargets = useTimelineStore((s) => s.dailyGoalTargets);
  const insights = useTimelineStore((s) => s.insights);
  const principles = useTimelineStore((s) => s.principles);

  const today = toDateKey(new Date());
  const weekRange = getWeekRange(today);

  // 1. Today's daily targets
  const todayTargets = useMemo(() => {
    return Object.values(dailyGoalTargets).filter((t) => t.date === today);
  }, [dailyGoalTargets, today]);

  // 2. Risk warnings
  const riskGoals = useMemo(() => {
    const allTargets = Object.values(dailyGoalTargets);
    return Object.values(goals)
      .filter((g) => g.status === 'active')
      .map((g) => ({ goal: g, risk: detectGoalRisk(g, allTargets) }))
      .filter((x) => x.risk !== null) as Array<{ goal: Goal; risk: NonNullable<ReturnType<typeof detectGoalRisk>> }>;
  }, [goals, dailyGoalTargets]);

  // 3. Weekly completion stats
  const weeklyStats = useMemo(() => {
    const weekTargets = Object.values(dailyGoalTargets).filter(
      (t) => t.date >= weekRange.start && t.date <= weekRange.end,
    );
    const completed = weekTargets.filter((t) => t.status === 'completed').length;
    const missed = weekTargets.filter((t) => t.status === 'missed').length;
    const adjusted = weekTargets.filter((t) => t.status === 'adjusted').length;
    const total = weekTargets.length;
    return { completed, missed, adjusted, total };
  }, [dailyGoalTargets, weekRange]);

  // 4. Aggregated gap reasons
  const gapReasons = useMemo(() => {
    const weekTargets = Object.values(dailyGoalTargets).filter(
      (t) => t.date >= weekRange.start && t.date <= weekRange.end && t.gapReasons && t.gapReasons.length > 0,
    );
    const counts: Record<string, number> = {};
    for (const t of weekTargets) {
      for (const reason of t.gapReasons!) {
        counts[reason] = (counts[reason] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [dailyGoalTargets, weekRange]);

  // 5. Principle count + recent
  const principleStats = useMemo(() => {
    const all = Object.values(principles);
    const sorted = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      count: all.length,
      recent: sorted.slice(0, 3),
    };
  }, [principles]);

  // 6. Latest insight
  const latestInsight = useMemo(() => {
    const all = Object.values(insights);
    if (all.length === 0) return null;
    return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }, [insights]);

  // Active goals
  const activeGoals = useMemo(() => {
    return Object.values(goals)
      .filter((g) => g.status === 'active')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [goals]);

  return (
    <div className="dashboard-view">
      <h2>目标总览</h2>

      <div className="dashboard-cards">
        {/* Card 1: Today's Actions */}
        <div className="dashboard-card">
          <h3>今日行动</h3>
          {todayTargets.length === 0 ? (
            <p className="dashboard-empty">今日暂无目标</p>
          ) : (
            <ul className="dashboard-target-list">
              {todayTargets.map((t) => (
                <li key={t.id} className={`dashboard-target-item status-${t.status}`}>
                  <span className="target-task">{t.plannedTask}</span>
                  <span className="target-status">{t.status === 'completed' ? '已完成' : t.status === 'missed' ? '未完成' : t.status === 'adjusted' ? '已调整' : '待完成'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 2: Risk Warnings */}
        <div className="dashboard-card">
          <h3>目标风险</h3>
          {riskGoals.length === 0 ? (
            <p className="dashboard-empty">暂无风险预警</p>
          ) : (
            <ul className="dashboard-risk-list">
              {riskGoals.map(({ goal, risk }) => (
                <li key={goal.id} className={`dashboard-risk-item risk-${risk.level}`}>
                  <strong>{goal.title}</strong>
                  <ul>
                    {risk.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 3: Weekly Progress */}
        <div className="dashboard-card">
          <h3>本周进度</h3>
          {weeklyStats.total === 0 ? (
            <p className="dashboard-empty">本周暂无目标数据</p>
          ) : (
            <div className="dashboard-stats">
              <div className="stat-item">
                <span className="stat-value">{weeklyStats.completed}</span>
                <span className="stat-label">已完成</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{weeklyStats.missed}</span>
                <span className="stat-label">未完成</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{weeklyStats.adjusted}</span>
                <span className="stat-label">已调整</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{weeklyStats.total}</span>
                <span className="stat-label">总计</span>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Gap Reasons */}
        <div className="dashboard-card">
          <h3>偏差原因</h3>
          {gapReasons.length === 0 ? (
            <p className="dashboard-empty">本周暂无偏差记录</p>
          ) : (
            <ul className="dashboard-gap-list">
              {gapReasons.map(([reason, count]) => (
                <li key={reason} className="dashboard-gap-item">
                  <span className="gap-label">{GAP_REASON_LABELS[reason as GapReason] ?? reason}</span>
                  <span className="gap-count">{count} 次</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 5: Principles */}
        <div className="dashboard-card">
          <h3>原则沉淀</h3>
          <p className="dashboard-principle-count">共 {principleStats.count} 条原则</p>
          {principleStats.recent.length > 0 && (
            <ul className="dashboard-principle-list">
              {principleStats.recent.map((p) => (
                <li key={p.id} className="dashboard-principle-item">
                  <strong>{p.title}</strong>
                  <p>{p.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card 6: AI Insight */}
        <div className="dashboard-card">
          <h3>AI 建议</h3>
          {latestInsight ? (
            <div className="dashboard-insight">
              <strong>{latestInsight.title}</strong>
              <p>{latestInsight.summary}</p>
            </div>
          ) : (
            <p className="dashboard-empty">暂无 AI 洞察</p>
          )}
        </div>
      </div>

      {/* Active Goals List */}
      <div className="dashboard-active-goals">
        <h3>进行中目标</h3>
        {activeGoals.length === 0 ? (
          <p className="dashboard-empty">暂无进行中的目标</p>
        ) : (
          <ul className="dashboard-goal-list">
            {activeGoals.map((g) => (
              <li key={g.id} className="dashboard-goal-item">
                <span
                  className="goal-status-dot"
                  style={{ backgroundColor: getGoalStatusColor(g.status) }}
                />
                <span className="goal-title">{g.title}</span>
                <span className="goal-period">{g.period === 'week' ? '周' : '月'}</span>
                <span className="goal-dates">{g.startDate} ~ {g.endDate}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
