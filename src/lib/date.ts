import { startOfWeek, endOfWeek, eachDayOfInterval, format, parse, isSameDay, subDays } from 'date-fns';
import type { Entry } from './schema';

/** Convert a Date to local 'YYYY-MM-DD' string */
export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Extract 'YYYY-MM' from a date key */
export function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** Get all date keys for a given month ('YYYY-MM') */
export function getMonthDays(monthKey: string): string[] {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // day 0 = last day of prev month

  const days: string[] = [];
  for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(toDateKey(new Date(d)));
  }
  return days;
}

/** Get Monday–Sunday range containing the given date key */
export function getWeekRange(dateKey: string): { start: string; end: string } {
  const d = parse(dateKey, 'yyyy-MM-dd', new Date());
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  const sunday = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start: toDateKey(monday),
    end: toDateKey(sunday),
  };
}

/** Check if an entry has any bullets */
function hasBullets(entry: Entry): boolean {
  return (
    entry.bullets.work.length > 0 ||
    entry.bullets.study.length > 0 ||
    entry.bullets.side.length > 0
  );
}

/** Count consecutive days with bullets ending on `today` */
export function calculateStreak(entries: Entry[], today: string): number {
  const entryMap = new Map<string, Entry>();
  for (const e of entries) {
    entryMap.set(e.date, e);
  }

  let streak = 0;
  let currentDate = parse(today, 'yyyy-MM-dd', new Date());

  while (true) {
    const key = toDateKey(currentDate);
    const entry = entryMap.get(key);
    if (!entry || !hasBullets(entry)) {
      break;
    }
    streak++;
    currentDate = subDays(currentDate, 1);
  }

  return streak;
}
