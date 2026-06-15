import { useTimelineStore } from '../../store';
import type { DailyGoalStatus, GapReason } from '../../lib/schema';

interface Props {
  date: string;
}

const STATUS_LABELS: Record<DailyGoalStatus, string> = {
  pending: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  partially_completed: '部分完成',
  missed: '未完成',
  adjusted: '已调整',
};

const GAP_REASON_LABELS: Record<GapReason, string> = {
  not_enough_time: '时间不足',
  task_too_large: '任务过大',
  technical_blocker: '技术卡点',
  priority_conflict: '优先级冲突',
  low_energy: '状态不好',
  unclear_goal: '目标不清',
  external_interruption: '外部干扰',
  other: '其他',
};

export function DailyGoalReviewPanel({ date }: Props) {
  const targets = useTimelineStore(s => s.getDailyTargetsByDate(date));
  const updateDailyGoalTarget = useTimelineStore(s => s.updateDailyGoalTarget);

  if (targets.length === 0) {
    return <div className="text-sm text-gray-500">今日无目标牵引</div>;
  }

  return (
    <div className="space-y-4">
      <h3>今日目标牵引</h3>
      {targets.map(t => (
        <div key={t.id} className="border rounded p-3 space-y-2">
          <div className="text-sm text-gray-500">关联目标: {t.goalId}</div>
          <div><strong>今日计划:</strong> {t.plannedTask}</div>
          <div><strong>最低完成标准:</strong> {t.minimumStandard}</div>
          <div><strong>预期产出:</strong> {t.expectedOutput}</div>
          <div>
            <strong>复盘问题:</strong>
            <ol>{t.reviewQuestions.map((q, i) => <li key={i}>{q}</li>)}</ol>
          </div>
          <select
            value={t.status}
            onChange={(e) => updateDailyGoalTarget(t.id, { status: e.target.value as DailyGoalStatus })}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea
            placeholder="实际进度"
            defaultValue={t.actualProgress ?? ''}
            onBlur={(e) => updateDailyGoalTarget(t.id, { actualProgress: e.target.value })}
          />
          <textarea
            placeholder="差距"
            defaultValue={t.gap ?? ''}
            onBlur={(e) => updateDailyGoalTarget(t.id, { gap: e.target.value })}
          />
          <div>
            <strong>差距原因:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(GAP_REASON_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={(t.gapReasons ?? []).includes(value as GapReason)}
                    onChange={(e) => {
                      const current = t.gapReasons ?? [];
                      const reason = value as GapReason;
                      const next = e.target.checked
                        ? [...current, reason]
                        : current.filter(r => r !== reason);
                      updateDailyGoalTarget(t.id, { gapReasons: next });
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <textarea
            placeholder="明日调整"
            defaultValue={t.nextAdjustment ?? ''}
            onBlur={(e) => updateDailyGoalTarget(t.id, { nextAdjustment: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
