import type { Table } from "dexie";
import { db } from "@/lib/db/dexie";
import { activeRecords } from "@/lib/data/repository";
import { createHabit, type HabitInput } from "@/lib/data/habits";
import { getGameState, recomputeAchievements } from "@/lib/data/game";
import { getSettings } from "@/lib/data/settings";
import { runSync } from "@/lib/sync/sync-engine";
import type { Domain, OwnedRecord } from "@/lib/types";
import { translate, type DictKey } from "@/lib/i18n";
import { useLocaleStore } from "@/stores/locale-store";
import { LOCAL_USER_ID } from "@/lib/constants";
import { deterministicId } from "@/lib/id";

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
const ADOPTED_KEY = "lifeos:adopted";

/**
 * When a device that has been used in local mode signs into a cloud account for
 * the first time, migrate ("adopt") its local-mode data into that account so
 * nothing is lost. Records are reassigned in place (same ids) from LOCAL_USER_ID
 * to the signed-in user id and marked dirty; the sync engine then pushes them.
 *
 * Guards keep this safe: it runs at most once per device (a global marker) and
 * only into an account that has no local data yet, so it never clobbers an
 * existing account or merges the same data twice.
 */
async function adoptLocalData(toUserId: string): Promise<boolean> {
  if (toUserId === LOCAL_USER_ID) return false;
  if (typeof localStorage !== "undefined" && localStorage.getItem(ADOPTED_KEY)) return false;

  const database = db();
  const now = new Date().toISOString();
  const markDone = () => {
    if (typeof localStorage !== "undefined") localStorage.setItem(ADOPTED_KEY, now);
  };

  // Only adopt into a fresh account (no habits yet on this device for it).
  const targetHabits = await database.habits.where("user_id").equals(toUserId).count();
  if (targetHabits > 0) {
    markDone();
    return false;
  }

  const tables = [
    database.habits, database.habitLogs, database.gameState, database.xpEvents,
    database.freeDays, database.shopPurchases, database.userAchievements,
    database.challenges, database.settings,
  ] as unknown as Table<OwnedRecord, string>[];

  let moved = 0;
  for (const table of tables) {
    const rows = await table.where("user_id").equals(LOCAL_USER_ID).toArray();
    for (const row of rows) {
      await table.put({ ...row, user_id: toUserId, updated_at: now, _dirty: true });
      moved += 1;
    }
  }
  markDone();
  return moved > 0;
}

/**
 * Idempotently provision a user's baseline data: settings, game state, default
 * habits, and initial achievement progress. Uses a localStorage marker plus a
 * DB check so it never double-seeds, even across reloads.
 */
export async function ensureUserData(userId: string): Promise<void> {
  // First cloud sign-in on a formerly-local device: migrate local data first.
  await adoptLocalData(userId);

  // Pull any existing cloud data for this account BEFORE deciding to seed, so a
  // second device (or a returning user) doesn't duplicate the default habits.
  // No-op in local/offline mode.
  await runSync(userId).catch(() => {});

  const marker = typeof localStorage !== "undefined" ? localStorage.getItem(BOOTSTRAP_KEY(userId)) : null;
  const habitCount = activeRecords(await db().habits.where("user_id").equals(userId).toArray()).length;

  await getSettings(userId);
  await getGameState(userId);

  const setMarker = () => {
    if (typeof localStorage !== "undefined") localStorage.setItem(BOOTSTRAP_KEY(userId), new Date().toISOString());
  };

  if (habitCount > 0) {
    // Account already has habits (adopted or pulled from the cloud) — don't seed.
    if (!marker) setMarker();
    return;
  }

  if (!marker) {
    // Brand-new account with no data anywhere: seed the localized defaults.
    // Deterministic ids (userId + seed key) make seeding idempotent across
    // devices — two devices that seed produce identical ids and merge.
    const locale = useLocaleStore.getState().locale;
    for (const h of DEFAULT_HABITS) {
      await createHabit(userId, {
        ...h,
        name: translate(locale, h.nameKey),
        id: deterministicId(`${userId}:seed:${h.nameKey}`),
      });
    }
    await recomputeAchievements(userId);
    setMarker();
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
