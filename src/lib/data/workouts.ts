import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import type { Workout, WorkoutSource, DayKey } from "@/lib/types";

const workoutOpts = (userId: string) => ({ table: db().workouts, syncTable: "workouts" as const, userId });

/** Activity presets (i18n keys `workouts.activity.<key>`); free text also allowed. */
export const ACTIVITY_PRESETS = ["run", "gym", "bike", "swim", "walk", "hike", "yoga", "other"] as const;

export async function listWorkouts(userId: string): Promise<Workout[]> {
  return activeRecords(await db().workouts.where("user_id").equals(userId).toArray()).sort((a, b) =>
    b.day.localeCompare(a.day) || b.created_at.localeCompare(a.created_at),
  );
}

export async function workoutsForDay(userId: string, day: DayKey): Promise<Workout[]> {
  return activeRecords(await db().workouts.where("[user_id+day]").equals([userId, day]).toArray());
}

export async function workoutsInRange(userId: string, fromDay: DayKey, toDay: DayKey): Promise<Workout[]> {
  return (await listWorkouts(userId)).filter((w) => w.day >= fromDay && w.day <= toDay);
}

/** Total calories burned on a day (0 when none recorded). */
export async function burnedForDay(userId: string, day: DayKey): Promise<number> {
  return (await workoutsForDay(userId, day)).reduce((sum, w) => sum + (w.calories ?? 0), 0);
}

export interface WorkoutInput {
  day: DayKey;
  activity: string;
  durationMin?: number;
  distanceKm?: number;
  calories?: number;
  notes?: string;
  source?: WorkoutSource;
  externalId?: string;
}

export async function createWorkout(userId: string, input: WorkoutInput): Promise<Workout> {
  const workout = makeRecord<Workout>(userId, {
    day: input.day,
    activity: input.activity.trim() || "other",
    durationMin: input.durationMin,
    distanceKm: input.distanceKm,
    calories: input.calories,
    notes: input.notes?.trim() || undefined,
    source: input.source ?? "manual",
    externalId: input.externalId,
  });
  return upsert(workoutOpts(userId), workout);
}

export async function updateWorkout(userId: string, workout: Workout): Promise<Workout> {
  return upsert(workoutOpts(userId), workout);
}

export async function deleteWorkout(userId: string, id: string): Promise<void> {
  await softDelete(workoutOpts(userId), id);
}
