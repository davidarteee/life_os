import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import type { Habit, HabitLog, Domain } from "@/lib/types";
import { dayKey } from "@/lib/date";

const habitOpts = (userId: string) => ({ table: db().habits, syncTable: "habits" as const, userId });
const logOpts = (userId: string) => ({ table: db().habitLogs, syncTable: "habit_logs" as const, userId });

/* ------------------------------------------------------------- Queries ---- */

export async function listHabits(userId: string, includeArchived = false): Promise<Habit[]> {
  const rows = activeRecords(await db().habits.where("user_id").equals(userId).toArray());
  return rows
    .filter((h) => includeArchived || h.active)
    .sort((a, b) => a.order - b.order);
}

export async function logsForDay(userId: string, day: string): Promise<HabitLog[]> {
  return activeRecords(await db().habitLogs.where("[user_id+day]").equals([userId, day]).toArray());
}

export async function logsForHabit(userId: string, habitId: string): Promise<HabitLog[]> {
  const rows = activeRecords(await db().habitLogs.where("habitId").equals(habitId).toArray());
  return rows.filter((l) => l.user_id === userId).sort((a, b) => a.day.localeCompare(b.day));
}

export async function allLogs(userId: string): Promise<HabitLog[]> {
  return activeRecords(await db().habitLogs.where("user_id").equals(userId).toArray());
}

/* ----------------------------------------------------------- Mutations ---- */

export interface HabitInput {
  name: string;
  icon?: string;
  color?: Domain | "neutral";
  cadence?: Habit["cadence"];
  customDays?: number[];
  target?: number;
  unit?: string;
  xpReward?: number;
  required?: boolean;
}

export async function createHabit(userId: string, input: HabitInput): Promise<Habit> {
  const count = await db().habits.where("user_id").equals(userId).count();
  const habit = makeRecord<Habit>(userId, {
    name: input.name.trim(),
    icon: input.icon ?? "CircleCheck",
    color: input.color ?? "health",
    cadence: input.cadence ?? "daily",
    customDays: input.customDays ?? [],
    target: Math.max(1, input.target ?? 1),
    unit: input.unit,
    xpReward: input.xpReward ?? 10,
    required: input.required ?? true,
    active: true,
    order: count,
  });
  return upsert(habitOpts(userId), habit);
}

export async function updateHabit(userId: string, habit: Habit): Promise<Habit> {
  return upsert(habitOpts(userId), habit);
}

export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  await softDelete(habitOpts(userId), habitId);
}

export async function reorderHabits(userId: string, orderedIds: string[]): Promise<void> {
  const habits = await listHabits(userId, true);
  const byId = new Map(habits.map((h) => [h.id, h]));
  for (let i = 0; i < orderedIds.length; i++) {
    const h = byId.get(orderedIds[i]);
    if (h && h.order !== i) await upsert(habitOpts(userId), { ...h, order: i });
  }
}

/** Is the habit scheduled for the given weekday index (0=Mon..6=Sun)? */
export function isScheduledOn(habit: Habit, weekday: number): boolean {
  if (habit.cadence === "daily") return true;
  if (habit.cadence === "weekdays") return weekday < 5;
  if (habit.cadence === "custom") return habit.customDays.length === 0 || habit.customDays.includes(weekday);
  return true;
}

/**
 * Toggle / advance a habit for a day. For target=1 this is a plain toggle. For
 * counted habits it advances progress and marks complete at target; toggling a
 * completed counted habit resets it. Returns the log and whether it just
 * became completed (so callers can award XP exactly once).
 */
export async function advanceHabit(
  userId: string,
  habit: Habit,
  day: string = dayKey(),
): Promise<{ log: HabitLog; becameCompleted: boolean; becameUncompleted: boolean }> {
  const existing = await db().habitLogs.where("[habitId+day]").equals([habit.id, day]).first();

  let count: number;
  if (!existing || existing.deleted) count = 1;
  else if (existing.completed) count = 0; // reset
  else count = existing.count + 1;

  const completed = count >= habit.target;
  const base: HabitLog =
    existing && !existing.deleted
      ? existing
      : makeRecord<HabitLog>(userId, { habitId: habit.id, day, count: 0, completed: false });

  const wasCompleted = existing?.completed ?? false;
  const next: HabitLog = {
    ...base,
    deleted: false,
    count,
    completed,
    completedAt: completed ? new Date().toISOString() : undefined,
  };
  const saved = await upsert(logOpts(userId), next);
  return {
    log: saved,
    becameCompleted: completed && !wasCompleted,
    becameUncompleted: !completed && wasCompleted,
  };
}
