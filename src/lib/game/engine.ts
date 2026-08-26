import type { DayKey } from "@/lib/types";
import { shiftDayKey } from "@/lib/date";
import { levelProgress } from "@/lib/game/xp";
import { ACHIEVEMENTS, type AchievementDefEx, type AchievementMetric } from "@/lib/game/achievements-def";

/**
 * Pure gamification engine. No I/O, no dates-from-now hidden inside — callers
 * pass everything in. This keeps every rule deterministic and unit-testable,
 * which matters because these functions decide XP, streaks and lost lives.
 */

/* --------------------------------------------------------------- Streaks -- */

/**
 * Current streak = number of consecutive completed days ending today, or ending
 * yesterday if today isn't done yet (so an unfinished today doesn't reset it).
 */
export function currentStreak(completedDays: Iterable<DayKey>, todayKey: DayKey): number {
  const set = completedDays instanceof Set ? completedDays : new Set(completedDays);
  if (set.size === 0) return 0;

  let cursor: DayKey;
  if (set.has(todayKey)) cursor = todayKey;
  else if (set.has(shiftDayKey(todayKey, -1))) cursor = shiftDayKey(todayKey, -1);
  else return 0;

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive completed days ever. */
export function longestStreak(completedDays: Iterable<DayKey>): number {
  const days = Array.from(new Set(completedDays)).sort();
  let best = 0;
  let run = 0;
  let prev: DayKey | null = null;
  for (const d of days) {
    run = prev && shiftDayKey(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/* ----------------------------------------------------------- Day / lives -- */

export interface DayEvaluationInput {
  requiredHabitIds: string[];
  completedRequiredIds: Set<string>;
  isFreeDay: boolean;
  missThreshold: number;
}

export interface DayEvaluation {
  requiredCount: number;
  missedCount: number;
  allRequiredDone: boolean;
  /** Whether this day, if past and unprotected, should cost a life. */
  costsLife: boolean;
}

export function evaluateDay(input: DayEvaluationInput): DayEvaluation {
  const requiredCount = input.requiredHabitIds.length;
  const missed = input.requiredHabitIds.filter((id) => !input.completedRequiredIds.has(id));
  const missedCount = missed.length;
  const allRequiredDone = requiredCount > 0 && missedCount === 0;
  const costsLife = !input.isFreeDay && requiredCount > 0 && missedCount >= input.missThreshold;
  return { requiredCount, missedCount, allRequiredDone, costsLife };
}

/* -------------------------------------------------------- Achievements ---- */

export interface AchievementCounters {
  habitsCompleted: number;
  habitStreak: number;
  perfectDays: number;
  tasksCompleted: number;
  level: number;
  challengesVerified: number;
  xpTotal: number;
  freeDaysUsed: number;
}

export function countersToMetric(counters: AchievementCounters, metric: AchievementMetric): number {
  return counters[metric];
}

export interface AchievementResolution {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  /** True on the transition from locked → unlocked in this evaluation. */
  justUnlocked: boolean;
}

/**
 * Resolve every achievement against current counters. `alreadyUnlocked` lets us
 * detect the locked→unlocked transition so callers can award XP + toast once.
 */
export function resolveAchievements(
  counters: AchievementCounters,
  alreadyUnlocked: Set<string>,
  defs: AchievementDefEx[] = ACHIEVEMENTS,
): AchievementResolution[] {
  return defs.map((def) => {
    const value = countersToMetric(counters, def.metric);
    const goal = def.goal ?? 1;
    const unlocked = value >= goal;
    const wasUnlocked = alreadyUnlocked.has(def.id);
    return {
      achievementId: def.id,
      progress: Math.min(value, goal),
      unlocked: unlocked || wasUnlocked,
      justUnlocked: unlocked && !wasUnlocked,
    };
  });
}

export function xpForTotal(totalXp: number): number {
  return levelProgress(totalXp).level;
}
