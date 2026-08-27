import type { Habit, Task, GameConfig, DayKey } from "@/lib/types";
import { db } from "@/lib/db/dexie";
import { activeRecords } from "@/lib/data/repository";
import { advanceHabit, listHabits, logsForDay, isScheduledOn } from "@/lib/data/habits";
import { toggleTask, taskXp } from "@/lib/data/tasks";
import { awardXp, recomputeAchievements, type AchievementUnlock } from "@/lib/data/game";
import { dayTotals, getNutritionConfig, targetsMet } from "@/lib/data/nutrition";
import { XP_REASON } from "@/lib/game/config";
import { dayKey, weekdayIndex, fromDayKey } from "@/lib/date";

/**
 * Composed user actions — the layer the UI calls. These stitch together the
 * habit store, the XP ledger, the daily "all habits" bonus, and achievement
 * recomputation so a single tap produces one consistent, reversible outcome.
 */

export interface ToggleOutcome {
  becameCompleted: boolean;
  becameUncompleted: boolean;
  xpDelta: number;
  bonusDelta: number;
  unlocks: AchievementUnlock[];
}

/** Net "all habits done" bonus already applied for a day (append-only ledger). */
async function netDailyBonus(userId: string, day: DayKey): Promise<number> {
  const events = activeRecords(await db().xpEvents.where("[user_id+day]").equals([userId, day]).toArray());
  return events
    .filter((e) => e.reason === XP_REASON.allHabitsBonus)
    .reduce((sum, e) => sum + e.amount, 0);
}

async function scheduledHabitsFor(userId: string, day: DayKey): Promise<Habit[]> {
  const weekday = weekdayIndex(fromDayKey(day));
  const habits = await listHabits(userId);
  return habits.filter((h) => isScheduledOn(h, weekday));
}

export async function toggleHabitAction(
  userId: string,
  habit: Habit,
  config: GameConfig,
  day: DayKey = dayKey(),
): Promise<ToggleOutcome> {
  const { becameCompleted, becameUncompleted } = await advanceHabit(userId, habit, day);

  let xpDelta = 0;
  if (becameCompleted) {
    await awardXp(userId, habit.xpReward, XP_REASON.habitComplete, { day, meta: { habitId: habit.id } });
    xpDelta += habit.xpReward;
  } else if (becameUncompleted) {
    await awardXp(userId, -habit.xpReward, XP_REASON.habitComplete, { day, meta: { habitId: habit.id, reverse: true } });
    xpDelta -= habit.xpReward;
  }

  // Reconcile the daily "all scheduled habits complete" bonus.
  let bonusDelta = 0;
  const scheduled = await scheduledHabitsFor(userId, day);
  const logs = await logsForDay(userId, day);
  const completedIds = new Set(logs.filter((l) => l.completed).map((l) => l.habitId));
  const allDone = scheduled.length > 0 && scheduled.every((h) => completedIds.has(h.id));
  const bonusActive = (await netDailyBonus(userId, day)) > 0;

  if (allDone && !bonusActive) {
    await awardXp(userId, config.xp.allHabitsBonus, XP_REASON.allHabitsBonus, { day });
    bonusDelta = config.xp.allHabitsBonus;
  } else if (!allDone && bonusActive) {
    await awardXp(userId, -config.xp.allHabitsBonus, XP_REASON.allHabitsBonus, { day, meta: { reverse: true } });
    bonusDelta = -config.xp.allHabitsBonus;
  }

  const unlocks = await recomputeAchievements(userId);
  return { becameCompleted, becameUncompleted, xpDelta, bonusDelta, unlocks };
}

export interface TaskToggleOutcome {
  becameDone: boolean;
  becameTodo: boolean;
  xpDelta: number;
  unlocks: AchievementUnlock[];
}

/**
 * Toggle a task done/undone and reconcile XP (by priority) + achievements.
 * Mirrors the habit action so both modules earn XP the same way.
 */
export async function toggleTaskAction(
  userId: string,
  task: Task,
  config: GameConfig,
): Promise<TaskToggleOutcome> {
  const { becameDone, becameTodo } = await toggleTask(userId, task);
  const xp = taskXp(task.priority, config.xp);

  let xpDelta = 0;
  if (becameDone) {
    await awardXp(userId, xp, XP_REASON.taskComplete, { meta: { taskId: task.id, priority: task.priority } });
    xpDelta = xp;
  } else if (becameTodo) {
    await awardXp(userId, -xp, XP_REASON.taskComplete, { meta: { taskId: task.id, reverse: true } });
    xpDelta = -xp;
  }

  const unlocks = await recomputeAchievements(userId);
  return { becameDone, becameTodo, xpDelta, unlocks };
}

/** Net nutrition-target bonus already applied for a day (append-only ledger). */
async function netNutritionBonus(userId: string, day: DayKey): Promise<number> {
  const events = activeRecords(await db().xpEvents.where("[user_id+day]").equals([userId, day]).toArray());
  return events
    .filter((e) => e.reason === XP_REASON.nutritionTarget)
    .reduce((sum, e) => sum + e.amount, 0);
}

export interface NutritionReconcileOutcome {
  targetsMet: boolean;
  xpDelta: number;
  unlocks: AchievementUnlock[];
}

/**
 * Reconcile the once-per-day "nutrition targets met" XP after any change to a
 * day's food log. Mirrors the all-habits bonus: awards `nutritionTarget` XP the
 * first time the day's totals hit the targets and reverses it if a later edit
 * drops the day back below them — so the ledger is always idempotent and the XP
 * never double-counts. Exercise never earns XP here (a "do sport" habit does).
 */
export async function reconcileNutrition(
  userId: string,
  day: DayKey,
  config: GameConfig,
): Promise<NutritionReconcileOutcome> {
  const nutrition = await getNutritionConfig(userId);
  const totals = await dayTotals(userId, day);
  const met = targetsMet(totals, nutrition.targets);
  const active = (await netNutritionBonus(userId, day)) > 0;

  let xpDelta = 0;
  if (met && !active) {
    await awardXp(userId, config.xp.nutritionTarget, XP_REASON.nutritionTarget, { day });
    xpDelta = config.xp.nutritionTarget;
  } else if (!met && active) {
    await awardXp(userId, -config.xp.nutritionTarget, XP_REASON.nutritionTarget, { day, meta: { reverse: true } });
    xpDelta = -config.xp.nutritionTarget;
  }

  const unlocks = await recomputeAchievements(userId);
  return { targetsMet: met, xpDelta, unlocks };
}
