import type { GameConfig } from "@/lib/types";

/**
 * Default gamification configuration. Every value here is user-editable through
 * Settings (persisted on {@link UserSettings.game}); nothing is hardcoded into
 * the engine. These defaults come straight from the LifeOS spec.
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  xp: {
    habitComplete: 10,
    allHabitsBonus: 30,
    taskLow: 5,
    taskMedium: 10,
    taskHigh: 20,
    nutritionTarget: 20,
  },
  lives: {
    maxLives: 3,
    missThreshold: 2,
  },
  shop: {
    extra_life: 200,
    free_day: 300,
    streak_shield: 100,
  },
};

/** Human-facing reasons for the XP ledger (kept stable as machine keys). */
export const XP_REASON = {
  habitComplete: "habit.complete",
  allHabitsBonus: "habit.allDailyBonus",
  achievement: "achievement.unlock",
  challengeVerified: "challenge.verified",
  shopSpend: "shop.spend",
  levelAdjust: "admin.adjust",
} as const;
