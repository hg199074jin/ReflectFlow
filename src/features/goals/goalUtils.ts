import type { Goal, GoalPeriod, GoalStatus, Entry } from '../../lib/schema';
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
    case 'active': return '#10b981';
    case 'done': return '#6b7280';
    case 'paused': return '#f59e0b';
    case 'dropped': return '#ef4444';
    default: return '#6b7280';
  }
}

export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
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
