import type { Habit, GameConfig, DayKey } from "@/lib/types";
import { db } from "@/lib/db/dexie";
import { activeRecords } from "@/lib/data/repository";
import { advanceHabit, listHabits, logsForDay, isScheduledOn } from "@/lib/data/habits";
import { awardXp, recomputeAchievements, type AchievementUnlock } from "@/lib/data/game";
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
