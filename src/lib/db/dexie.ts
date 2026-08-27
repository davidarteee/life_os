import Dexie, { type Table } from "dexie";
import type {
  Habit,
  HabitLog,
  GameState,
  XpEvent,
  FreeDay,
  ShopPurchase,
  UserAchievement,
  Challenge,
  UserSettings,
  Task,
  Food,
  FoodEntry,
  Workout,
} from "@/lib/types";

/**
 * IndexedDB, via Dexie, is LifeOS's local source of truth. The app reads and
 * writes here first (so it works fully offline / without Supabase); the sync
 * engine later reconciles with the cloud. Each table is indexed by user_id so a
 * future multi-user device stays cleanly partitioned.
 */

/** An entry in the offline outbox — one pending write to push to the cloud. */
export interface Mutation {
  id: string;
  user_id: string;
  table: SyncTable;
  op: "upsert" | "delete";
  recordId: string;
  payload: unknown;
  createdAt: string;
  /** Incremented on each failed push attempt, for backoff/diagnostics. */
  attempts: number;
}

export type SyncTable =
  | "habits"
  | "habit_logs"
  | "game_state"
  | "xp_events"
  | "free_days"
  | "shop_purchases"
  | "user_achievements"
  | "challenges"
  | "user_settings"
  | "tasks"
  | "foods"
  | "food_entries"
  | "workouts";

export class LifeOSDatabase extends Dexie {
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  gameState!: Table<GameState, string>;
  xpEvents!: Table<XpEvent, string>;
  freeDays!: Table<FreeDay, string>;
  shopPurchases!: Table<ShopPurchase, string>;
  userAchievements!: Table<UserAchievement, string>;
  challenges!: Table<Challenge, string>;
  settings!: Table<UserSettings, string>;
  tasks!: Table<Task, string>;
  foods!: Table<Food, string>;
  foodEntries!: Table<FoodEntry, string>;
  workouts!: Table<Workout, string>;
  mutations!: Table<Mutation, string>;

  constructor() {
    super("lifeos");
    this.version(1).stores({
      habits: "id, user_id, order, active, [user_id+active]",
      habitLogs: "id, user_id, habitId, day, [user_id+day], [habitId+day]",
      gameState: "id, user_id",
      xpEvents: "id, user_id, day, [user_id+day]",
      freeDays: "id, user_id, day, [user_id+day]",
      shopPurchases: "id, user_id, day",
      userAchievements: "id, user_id, achievementId, [user_id+achievementId]",
      challenges: "id, user_id, status, assignedDay",
      settings: "id, user_id",
      mutations: "id, user_id, table, createdAt",
    });
    // v2 — Tasks + Calendar. Existing tables carry forward unchanged.
    this.version(2).stores({
      tasks: "id, user_id, status, date, order, [user_id+date], [user_id+status]",
    });
    // v3 — Nutrition + Exercise.
    this.version(3).stores({
      foods: "id, user_id, favorite, useCount, name, [user_id+favorite]",
      foodEntries: "id, user_id, day, meal, [user_id+day]",
      workouts: "id, user_id, day, [user_id+day]",
    });
  }
}

let _db: LifeOSDatabase | null = null;

/** Lazily construct the DB (browser only — never touch IndexedDB on the server). */
export function db(): LifeOSDatabase {
  if (typeof window === "undefined") {
    throw new Error("LifeOS local DB is only available in the browser.");
  }
  if (!_db) _db = new LifeOSDatabase();
  return _db;
}

/**
 * Reliably wipe this device's local data: close the Dexie connection (so the
 * IndexedDB delete isn't blocked), delete the database, and clear LifeOS's
 * localStorage markers (bootstrap/adopted/lastPull/locale). Cloud data is
 * untouched — on next load the device re-syncs a clean copy from the account.
 */
export async function resetLocalDatabase(): Promise<void> {
  if (typeof window === "undefined") return;
  const database = _db ?? new LifeOSDatabase();
  await database.delete(); // Dexie closes the connection, then deletes the DB.
  _db = null;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("lifeos"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore storage access errors */
  }
}
