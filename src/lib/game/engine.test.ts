import { describe, it, expect } from "vitest";
import { currentStreak, longestStreak, evaluateDay, resolveAchievements } from "@/lib/game/engine";
import type { AchievementCounters } from "@/lib/game/engine";

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-08-23", "2026-08-24", "2026-08-25"], "2026-08-25")).toBe(3);
  });

  it("still counts when today isn't done but yesterday was", () => {
    expect(currentStreak(["2026-08-23", "2026-08-24"], "2026-08-25")).toBe(2);
  });

  it("resets when there is a gap", () => {
    expect(currentStreak(["2026-08-20", "2026-08-21"], "2026-08-25")).toBe(0);
  });

  it("finds the longest historical run", () => {
    expect(longestStreak(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-10"])).toBe(3);
  });

  it("handles empty input", () => {
    expect(currentStreak([], "2026-08-25")).toBe(0);
    expect(longestStreak([])).toBe(0);
  });
});

describe("evaluateDay / lives", () => {
  const req = ["a", "b", "c"];

  it("costs a life when misses reach the threshold on a normal day", () => {
    const r = evaluateDay({ requiredHabitIds: req, completedRequiredIds: new Set(["a"]), isFreeDay: false, missThreshold: 2 });
    expect(r.missedCount).toBe(2);
    expect(r.costsLife).toBe(true);
    expect(r.allRequiredDone).toBe(false);
  });

  it("does not cost a life below the threshold", () => {
    const r = evaluateDay({ requiredHabitIds: req, completedRequiredIds: new Set(["a", "b"]), isFreeDay: false, missThreshold: 2 });
    expect(r.missedCount).toBe(1);
    expect(r.costsLife).toBe(false);
  });

  it("never costs a life on a free day", () => {
    const r = evaluateDay({ requiredHabitIds: req, completedRequiredIds: new Set(), isFreeDay: true, missThreshold: 2 });
    expect(r.missedCount).toBe(3);
    expect(r.costsLife).toBe(false);
  });

  it("marks a perfect day when all required are done", () => {
    const r = evaluateDay({ requiredHabitIds: req, completedRequiredIds: new Set(req), isFreeDay: false, missThreshold: 2 });
    expect(r.allRequiredDone).toBe(true);
    expect(r.costsLife).toBe(false);
  });

  it("never costs a life when there are no required habits", () => {
    const r = evaluateDay({ requiredHabitIds: [], completedRequiredIds: new Set(), isFreeDay: false, missThreshold: 2 });
    expect(r.costsLife).toBe(false);
  });
});

describe("achievement resolution", () => {
  const counters: AchievementCounters = {
    habitsCompleted: 12,
    habitStreak: 8,
    perfectDays: 1,
    tasksCompleted: 0,
    nutritionDaysLogged: 0,
    nutritionTargetsHit: 0,
    level: 3,
    challengesVerified: 0,
    xpTotal: 400,
    freeDaysUsed: 0,
  };

  it("unlocks milestones once their goal is met and flags the transition", () => {
    const res = resolveAchievements(counters, new Set());
    const firstStep = res.find((r) => r.achievementId === "habits_done_10");
    expect(firstStep?.unlocked).toBe(true);
    expect(firstStep?.justUnlocked).toBe(true);

    const bigOne = res.find((r) => r.achievementId === "habits_done_100");
    expect(bigOne?.unlocked).toBe(false);
    expect(bigOne?.progress).toBe(12);
  });

  it("does not re-flag already-unlocked achievements", () => {
    const res = resolveAchievements(counters, new Set(["habits_done_10"]));
    const firstStep = res.find((r) => r.achievementId === "habits_done_10");
    expect(firstStep?.unlocked).toBe(true);
    expect(firstStep?.justUnlocked).toBe(false);
  });

  it("clamps progress to the goal", () => {
    const res = resolveAchievements({ ...counters, habitStreak: 999 }, new Set());
    const streak7 = res.find((r) => r.achievementId === "habit_streak_7");
    expect(streak7?.progress).toBe(7);
    expect(streak7?.unlocked).toBe(true);
  });
});
