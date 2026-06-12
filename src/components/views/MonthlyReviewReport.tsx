import { useMemo } from 'react';
import { useTimelineStore, getMonthReviewStats } from '../../store';
import { REVIEW_TAG_LABELS } from '../../lib/schema';
import type { ReviewTag } from '../../lib/schema';

interface MonthlyReviewReportProps {
  month: string;
}

export function MonthlyReviewReport({ month }: MonthlyReviewReportProps) {
  const entries = useTimelineStore((s) => s.entries);

  const stats = useMemo(() => {
    return getMonthReviewStats(month);
  }, [month, entries]);

  const completionRate = stats.totalDays > 0
    ? Math.round((stats.reviewDays / stats.totalDays) * 100)
    : 0;

  const sortedTags = Object.entries(stats.tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const qualityStars = stats.avgQuality > 0
    ? '★'.repeat(Math.round(stats.avgQuality)) + '☆'.repeat(5 - Math.round(stats.avgQuality))
    : '暂无评分';

  return (
    <div className="monthly-review-report">
      <h3 className="monthly-review-title">月度复盘报告</h3>
      <p className="monthly-review-month">{month}</p>

      <div className="monthly-review-stats">
        <div className="monthly-stat-card">
          <div className="monthly-stat-label">复盘天数</div>
          <div className="monthly-stat-value">{stats.reviewDays}</div>
          <div className="monthly-stat-sub">共 {stats.totalDays} 天</div>
        </div>

        <div className="monthly-stat-card">
          <div className="monthly-stat-label">复盘率</div>
          <div className="monthly-stat-value">{completionRate}%</div>
          <div className="monthly-stat-sub">
            <div className="monthly-progress-bar">
              <div
                className="monthly-progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="monthly-stat-card">
          <div className="monthly-stat-label">平均质量</div>
          <div className="monthly-stat-value">{stats.avgQuality}</div>
          <div className="monthly-stat-sub">{qualityStars}</div>
        </div>
      </div>

      {sortedTags.length > 0 && (
        <div className="monthly-review-tags">
          <h4>常见标签</h4>
          <div className="monthly-tags-list">
            {sortedTags.map(([tag, count]) => (
              <div key={tag} className="monthly-tag-item">
                <span className="monthly-tag-name">
                  {REVIEW_TAG_LABELS[tag as ReviewTag] || tag}
                </span>
                <span className="monthly-tag-count">{count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="monthly-review-insights">
        <h4>复盘洞察</h4>
        <ul>
          {stats.reviewDays === 0 && (
            <li>本月还没有开始复盘，建议从今天开始记录。</li>
          )}
          {stats.reviewDays > 0 && stats.reviewDays < 10 && (
            <li>复盘习惯正在养成中，建议每天坚持记录。</li>
          )}
          {stats.reviewDays >= 10 && stats.reviewDays < 20 && (
            <li>复盘频率不错，继续保持，争取每天都能记录。</li>
          )}
          {stats.reviewDays >= 20 && (
            <li>复盘习惯已经很好了！可以尝试更深入的复盘。</li>
          )}
          {stats.avgQuality > 0 && stats.avgQuality < 3 && (
            <li>复盘质量有提升空间，建议多写原因分析和经验提炼。</li>
          )}
          {stats.avgQuality >= 4 && (
            <li>复盘质量很高，继续保持！</li>
          )}
        </ul>
      </div>
    </div>
  );
}
