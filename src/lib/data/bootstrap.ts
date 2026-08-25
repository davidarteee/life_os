import { db } from "@/lib/db/dexie";
import { createHabit, type HabitInput } from "@/lib/data/habits";
import { getGameState, recomputeAchievements } from "@/lib/data/game";
import { getSettings } from "@/lib/data/settings";
import type { Domain } from "@/lib/types";
import { translate, type DictKey } from "@/lib/i18n";
import { useLocaleStore } from "@/stores/locale-store";

/**
 * Default habits from the LifeOS spec. Seeded once for a new user in their
 * current language; not system-locked — the user can edit, reorder or delete
 * any of them.
 */
const DEFAULT_HABITS: (HabitInput & { nameKey: DictKey })[] = [
  { nameKey: "seed.sleep", name: "", icon: "Moon", color: "health", required: true },
  { nameKey: "seed.exercise", name: "", icon: "Dumbbell", color: "health", required: true },
  { nameKey: "seed.stretch", name: "", icon: "StretchHorizontal", color: "health", required: true },
  { nameKey: "seed.read", name: "", icon: "BookOpen", color: "learning", required: true },
  { nameKey: "seed.coldShower", name: "", icon: "Snowflake", color: "health", required: false },
  { nameKey: "seed.noCheat", name: "", icon: "Salad", color: "health", required: true },
  { nameKey: "seed.meditate", name: "", icon: "Brain", color: "goals", required: true },
  { nameKey: "seed.write", name: "", icon: "PenLine", color: "productivity", required: false },
  { nameKey: "seed.nutrition", name: "", icon: "Apple", color: "health", required: true },
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
    const locale = useLocaleStore.getState().locale;
    for (const h of DEFAULT_HABITS) {
      await createHabit(userId, { ...h, name: translate(locale, h.nameKey) });
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
