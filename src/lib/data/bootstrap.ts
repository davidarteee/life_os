import { db } from "@/lib/db/dexie";
import { createHabit, type HabitInput } from "@/lib/data/habits";
import { getGameState, recomputeAchievements } from "@/lib/data/game";
import { getSettings } from "@/lib/data/settings";
import type { Domain } from "@/lib/types";

/**
 * Default habits from the LifeOS spec. Seeded once for a new user; not
 * system-locked — the user can edit, reorder, or delete any of them.
 */
const DEFAULT_HABITS: HabitInput[] = [
  { name: "Sleep 8 hours", icon: "Moon", color: "health", required: true },
  { name: "Exercise", icon: "Dumbbell", color: "health", required: true },
  { name: "Stretch", icon: "StretchHorizontal", color: "health", required: true },
  { name: "Read 10 minutes", icon: "BookOpen", color: "learning", required: true },
  { name: "Cold shower", icon: "Snowflake", color: "health", required: false },
  { name: "No cheat meals", icon: "Salad", color: "health", required: true },
  { name: "Meditate 5 minutes", icon: "Brain", color: "goals", required: true },
  { name: "Write", icon: "PenLine", color: "productivity", required: false },
  { name: "Register nutrition", icon: "Apple", color: "health", required: true },
];

const BOOTSTRAP_KEY = (userId: string) => `lifeos:bootstrapped:${userId}`;

/**
 * Idempotently provision a user's baseline data: settings, game state, default
 * habits, and initial achievement progress. Uses a localStorage marker plus a
 * DB check so it never double-seeds, even across reloads.
 */
export async function ensureUserData(userId: string): Promise<void> {
  const marker = typeof localStorage !== "undefined" ? localStorage.getItem(BOOTSTRAP_KEY(userId)) : null;
  const habitCount = await db().habits.where("user_id").equals(userId).count();

  await getSettings(userId);
  await getGameState(userId);

  if (!marker && habitCount === 0) {
    for (const h of DEFAULT_HABITS) {
      await createHabit(userId, h);
    }
    await recomputeAchievements(userId);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(BOOTSTRAP_KEY(userId), new Date().toISOString());
    }
  }
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  productivity: "Productivity",
  health: "Health",
  finance: "Finance",
  goals: "Goals",
  entertainment: "Entertainment",
  learning: "Learning",
};
