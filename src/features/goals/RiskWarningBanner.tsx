import { useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { detectGoalRisk } from './goalUtils';
import type { Goal } from '../../lib/schema';

interface Props {
  goal: Goal;
}

const LEVEL_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  warning: { bg: '#fef9c3', border: '#eab308', icon: '⚠️' },
  danger: { bg: '#fee2e2', border: '#ef4444', icon: '🚨' },
};

const DEFAULT_STYLE = { bg: '#fef9c3', border: '#eab308', icon: '⚠️' };

export function RiskWarningBanner({ goal }: Props) {
  const dailyGoalTargets = useTimelineStore(s => s.dailyGoalTargets);

  const risk = useMemo(() => {
    const targets = Object.values(dailyGoalTargets);
    return detectGoalRisk(goal, targets);
  }, [goal, dailyGoalTargets]);

  if (!risk) return null;

  const style = LEVEL_STYLES[risk.level] ?? DEFAULT_STYLE;

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <span>{style.icon}</span>
      <div>
        <strong>
          {risk.level === 'danger' ? '目标高风险' : '目标预警'}
        </strong>
        <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
          {risk.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
