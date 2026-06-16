import type { Goal, GoalPeriod, GoalStatus, Entry, DailyGoalTarget } from '../../lib/schema';
import { createId } from '../../lib/ids';
import { toDateKey } from '../../lib/date';

interface CreateGoalInput {
  title: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  notes?: string;
}

export function createEmptyGoal(input: CreateGoalInput): Goal {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: input.title,
    period: input.period,
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'active',
    linkedBullets: [],
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function calculateGoalProgress(
  goal: Goal,
  entries: Record<string, Entry>,
): { linkedCount: number; activeDays: number } {
  const linkedCount = goal.linkedBullets.length;

  // Count unique days with linked bullets
  const days = new Set<string>();
  for (const ref of goal.linkedBullets) {
    const entry = Object.values(entries).find((e) => e.id === ref.entryId);
    if (entry) {
      days.add(entry.date);
    }
  }

  return { linkedCount, activeDays: days.size };
}

export function isGoalStale(goal: Goal, entries: Record<string, Entry>): boolean {
  if (goal.status !== 'active') return false;

  const today = toDateKey(new Date());
  if (today > goal.endDate) return true;

  // Check if any linked bullets exist in the goal's period
  const { linkedCount } = calculateGoalProgress(goal, entries);
  return linkedCount === 0;
}

export function getGoalStatusColor(status: GoalStatus): string {
  switch (status) {
    case 'draft': return '#9ca3af';
    case 'active': return '#10b981';
    case 'done': return '#6b7280';
    case 'paused': return '#f59e0b';
    case 'dropped': return '#ef4444';
    default: return '#6b7280';
  }
}

export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case 'draft': return '草稿';
    case 'active': return '进行中';
    case 'done': return '已完成';
    case 'paused': return '已暂停';
    case 'dropped': return '已放弃';
    default: return status;
  }
}

export function getGoalPeriodLabel(period: GoalPeriod): string {
  switch (period) {
    case 'week': return '周目标';
    case 'month': return '月目标';
    default: return period;
  }
}

export interface GoalRisk {
  level: 'warning' | 'danger';
  reasons: string[];
}

/**
 * Detect goal risk based on consecutive missed days and deadline proximity.
 * - 2+ consecutive days missed → warning (yellow)
 * - 3+ consecutive days missed → danger (red)
 * - Deadline < 7 days and completed targets < 50% → danger (red)
 */
export function detectGoalRisk(goal: Goal, targets: DailyGoalTarget[]): GoalRisk | null {
  if (goal.status !== 'active') return null;

  // Sort targets by date descending to find consecutive misses from most recent
  const sorted = [...targets]
    .filter(t => t.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const reasons: string[] = [];
  let level: 'warning' | 'danger' = 'warning';

  // Count consecutive missed days from the most recent target
  let consecutiveMissed = 0;
  for (const t of sorted) {
    if (t.status === 'missed') {
      consecutiveMissed++;
    } else {
      break;
    }
  }

  if (consecutiveMissed >= 3) {
    level = 'danger';
    reasons.push(`连续 ${consecutiveMissed} 天未完成目标`);
  } else if (consecutiveMissed >= 2) {
    reasons.push(`连续 ${consecutiveMissed} 天未完成目标`);
  }

  // Check deadline proximity
  const today = new Date();
  const endDate = new Date(goal.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining > 0 && daysRemaining < 7) {
    const goalTargets = targets.filter(t => t.goalId === goal.id);
    const completed = goalTargets.filter(t => t.status === 'completed').length;
    const total = goalTargets.length;
    const completionRate = total > 0 ? completed / total : 0;

    if (completionRate < 0.5) {
      level = 'danger';
      reasons.push(`距截止日期仅剩 ${daysRemaining} 天，完成率仅 ${Math.round(completionRate * 100)}%`);
    }
  }

  if (reasons.length === 0) return null;
  return { level, reasons };
}
