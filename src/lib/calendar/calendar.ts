import type { DayKey, TaskPriority } from "@/lib/types";
import type { AccentKey } from "@/lib/domain-colors";
import { dayKey, addDays, weekdayIndex } from "@/lib/date";
import { tasksCalendarItems } from "@/lib/data/tasks";

/**
 * The unified LifeOS calendar. There is ONE central calendar; each module that
 * owns dated data exposes a "calendar provider" that returns {@link CalendarItem}s,
 * and this layer aggregates them. To add a module to the calendar later (e.g.
 * Study exams / assignments), import its provider and add it to
 * {@link collectCalendarItems} — nothing else changes.
 */

export type CalendarKind = "task" | "event" | "exam" | "assignment" | "birthday" | "freeday";

export interface CalendarItem {
  id: string;
  day: DayKey;
  title: string;
  kind: CalendarKind;
  accent: AccentKey;
  done?: boolean;
  priority?: TaskPriority;
  /** Where clicking the item should navigate (the owning module). */
  href: string;
}

/** Aggregate every module's dated items for a user. */
export async function collectCalendarItems(userId: string): Promise<CalendarItem[]> {
  const groups = await Promise.all([
    tasksCalendarItems(userId).catch(() => []),
    // Future modules register here, e.g. studyCalendarItems(userId), contactsBirthdays(userId)…
  ]);
  return groups.flat();
}

/** Group a flat list of items by day key for quick lookup in the grid. */
export function groupByDay(items: CalendarItem[]): Map<DayKey, CalendarItem[]> {
  const map = new Map<DayKey, CalendarItem[]>();
  for (const item of items) {
    if (!map.has(item.day)) map.set(item.day, []);
    map.get(item.day)!.push(item);
  }
  return map;
}

export interface MonthCell {
  key: DayKey;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
}

/**
 * A 6-week (42-cell) Monday-first grid covering the given month, including the
 * leading/trailing days from adjacent months so the grid is always rectangular.
 */
export function monthGrid(year: number, month: number, today: DayKey = dayKey()): MonthCell[] {
  const first = new Date(year, month, 1);
  const lead = weekdayIndex(first); // 0 = Monday
  const start = addDays(first, -lead);
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i);
    const key = dayKey(date);
    return { key, date, inMonth: date.getMonth() === month, isToday: key === today };
  });
}
