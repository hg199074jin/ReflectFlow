import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../../components/primitives/Button';
import { EvidenceList } from '../evidence/EvidenceList';
import { generateInsights } from './insightUtils';
import type { Insight, InsightSeverity } from '../../lib/schema';

const SEVERITY_COLORS: Record<InsightSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  info: '信息',
  warning: '警告',
  critical: '严重',
};

export function InsightsView() {
  const { entries, goals, insights, saveInsights, clearInsights } = useTimelineStore();
  const [filterSeverity, setFilterSeverity] = useState<InsightSeverity | 'all'>('all');
  const [generating, setGenerating] = useState(false);

  // Default to current month
  const now = new Date();
  const [periodStart, setPeriodStart] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  );

  const filteredInsights = useMemo(() => {
    let result = Object.values(insights).filter(
      (i) => i.periodStart >= periodStart && i.periodEnd <= periodEnd
    );
    if (filterSeverity !== 'all') {
      result = result.filter((i) => i.severity === filterSeverity);
    }
    return result.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [insights, periodStart, periodEnd, filterSeverity]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const newInsights = generateInsights({
        entries,
        goals,
        periodStart,
        periodEnd,
      });
      await saveInsights(newInsights);
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = async () => {
    await clearInsights();
  };

  return (
    <div className="insights-view">
      <div className="insights-header">
        <h2 className="insights-title">Trend Insights</h2>
        <div className="insights-actions">
          <Button variant="secondary" onClick={handleClear}>Clear</Button>
          <Button onClick={handleGenerate} loading={generating}>
            Generate Insights
          </Button>
        </div>
      </div>

      <div className="insights-period">
        <input
          type="date"
          className="insights-date-input"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
        />
        <span>~</span>
        <input
          type="date"
          className="insights-date-input"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
        />
      </div>

      <div className="insights-filters">
        <button
          className={`insights-filter-btn ${filterSeverity === 'all' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('all')}
        >
          All
        </button>
        <button
          className={`insights-filter-btn ${filterSeverity === 'critical' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('critical')}
        >
          Critical
        </button>
        <button
          className={`insights-filter-btn ${filterSeverity === 'warning' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('warning')}
        >
          Warning
        </button>
        <button
          className={`insights-filter-btn ${filterSeverity === 'info' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('info')}
        >
          Info
        </button>
      </div>

      <div className="insights-list">
        {filteredInsights.length === 0 ? (
          <p className="insights-empty">
            No insights for this period. Click "Generate Insights" to analyze your data.
          </p>
        ) : (
          filteredInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="insight-card" style={{ borderLeftColor: SEVERITY_COLORS[insight.severity] }}>
      <div className="insight-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="insight-card-info">
          <span
            className="insight-card-severity"
            style={{ color: SEVERITY_COLORS[insight.severity] }}
          >
            {SEVERITY_LABELS[insight.severity]}
          </span>
          <span className="insight-card-title">{insight.title}</span>
        </div>
        <span className={`insight-card-toggle ${expanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>
      <div className="insight-card-summary">{insight.summary}</div>
      {expanded && insight.evidenceRefs.length > 0 && (
        <div className="insight-card-evidence">
          <h4>Evidence</h4>
          <EvidenceList evidence={insight.evidenceRefs} />
        </div>
      )}
    </div>
  );
}
