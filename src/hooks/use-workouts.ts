"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listWorkouts, workoutsForDay, workoutsInRange } from "@/lib/data/workouts";
import { dayKey, shiftDayKey } from "@/lib/date";
import type { Workout } from "@/lib/types";

/** Live: all workouts, newest first. */
export function useWorkouts() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listWorkouts(uid) : []), [uid]) ?? [];
}

/** Live: workouts on a given day. */
export function useWorkoutsForDay(day: string = dayKey()) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? workoutsForDay(uid, day) : []), [uid, day]) ?? [];
}

export interface WorkoutStats {
  count: number;
  minutes: number;
  distanceKm: number;
  calories: number;
}

function summarize(workouts: Workout[]): WorkoutStats {
  return workouts.reduce<WorkoutStats>(
    (acc, w) => ({
      count: acc.count + 1,
      minutes: acc.minutes + (w.durationMin ?? 0),
      distanceKm: Math.round((acc.distanceKm + (w.distanceKm ?? 0)) * 10) / 10,
      calories: acc.calories + (w.calories ?? 0),
    }),
    { count: 0, minutes: 0, distanceKm: 0, calories: 0 },
  );
}

/** Live rolling-7-day workout summary for the dashboard/header. */
export function useWeekWorkoutStats(): WorkoutStats {
  const uid = useUserId();
  return (
    useLiveQuery(async () => {
      if (!uid) return summarize([]);
      const today = dayKey();
      const rows = await workoutsInRange(uid, shiftDayKey(today, -6), today);
      return summarize(rows);
    }, [uid]) ?? summarize([])
  );
}
