"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listHabits, logsForDay, allLogs, isScheduledOn } from "@/lib/data/habits";
import { currentStreak, longestStreak } from "@/lib/game/engine";
import { dayKey, weekdayIndex } from "@/lib/date";
import type { Habit, HabitLog } from "@/lib/types";

export interface HabitToday {
  habit: Habit;
  log?: HabitLog;
  completed: boolean;
  count: number;
  streak: number;
}

/** Live: all active habits + today's logs, joined with per-habit streaks. */
export function useTodayHabits(day: string = dayKey()) {
  const uid = useUserId();
  const data = useLiveQuery(async () => {
    if (!uid) return null;
    const [habits, todays, everything] = await Promise.all([
      listHabits(uid),
      logsForDay(uid, day),
      allLogs(uid),
    ]);
    const weekday = weekdayIndex(new Date());
    const logByHabit = new Map(todays.map((l) => [l.habitId, l]));

    const completedDaysByHabit = new Map<string, Set<string>>();
    for (const l of everything) {
      if (!l.completed) continue;
      if (!completedDaysByHabit.has(l.habitId)) completedDaysByHabit.set(l.habitId, new Set());
      completedDaysByHabit.get(l.habitId)!.add(l.day);
    }

    const scheduled = habits.filter((h) => isScheduledOn(h, weekday));
    const items: HabitToday[] = scheduled.map((habit) => {
      const log = logByHabit.get(habit.id);
      return {
        habit,
        log,
        completed: log?.completed ?? false,
        count: log?.count ?? 0,
        streak: currentStreak(completedDaysByHabit.get(habit.id) ?? new Set(), day),
      };
    });
    return { items, totalHabits: habits.length };
  }, [uid, day]);

  return { items: data?.items ?? [], loading: data === undefined, totalHabits: data?.totalHabits ?? 0 };
}

/** Live: full habit list with lifetime stats for the habits page. */
export function useHabitStats() {
  const uid = useUserId();
  return useLiveQuery(async () => {
    if (!uid) return null;
    const [habits, logs] = await Promise.all([listHabits(uid, true), allLogs(uid)]);
    const byHabit = new Map<string, Set<string>>();
    const counts = new Map<string, number>();
    for (const l of logs) {
      if (!l.completed) continue;
      if (!byHabit.has(l.habitId)) byHabit.set(l.habitId, new Set());
      byHabit.get(l.habitId)!.add(l.day);
      counts.set(l.habitId, (counts.get(l.habitId) ?? 0) + 1);
    }
    const today = dayKey();
    return habits.map((habit) => ({
      habit,
      totalCompleted: counts.get(habit.id) ?? 0,
      currentStreak: currentStreak(byHabit.get(habit.id) ?? new Set(), today),
      bestStreak: longestStreak(byHabit.get(habit.id) ?? new Set()),
    }));
  }, [uid]);
}
