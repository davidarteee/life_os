/**
 * LifeOS domain model.
 *
 * Every user-owned record extends {@link OwnedRecord}: it carries a user_id
 * (the RLS boundary), timestamps, a soft-delete flag (tombstones make offline
 * sync convergent), and a client-side dirty flag driving the mutation queue.
 * These field names match the Supabase schema 1:1 so the sync adapter is a
 * straight column map.
 */

export type ISODate = string; // full ISO timestamp
export type DayKey = string; // "YYYY-MM-DD" local

export interface OwnedRecord {
  id: string;
  user_id: string;
  created_at: ISODate;
  updated_at: ISODate;
  /** Soft delete tombstone — kept so peers converge on removal during sync. */
  deleted?: boolean;
  /** Client-only: pending push to the cloud. Never sent to the server. */
  _dirty?: boolean;
}

/** Life domains, used for accent colors and grouping across the app. */
export type Domain =
  | "productivity"
  | "health"
  | "finance"
  | "goals"
  | "entertainment"
  | "learning";

/* --------------------------------------------------------------- Habits -- */

export type HabitCadence = "daily" | "weekdays" | "custom";

export interface Habit extends OwnedRecord {
  name: string;
  icon: string; // lucide icon name
  color: Domain | "neutral";
  cadence: HabitCadence;
  /** For "custom" cadence: 0=Mon..6=Sun. Empty means every day. */
  customDays: number[];
  /** Target count per day (e.g. read 10 min → target 1; pushups → target N). */
  target: number;
  unit?: string;
  xpReward: number;
  /** Counts toward the "required habits / lives" rule when true. */
  required: boolean;
  active: boolean;
  order: number;
  archivedAt?: ISODate;
}

/** One habit on one day. Absence of a log means "not done". */
export interface HabitLog extends OwnedRecord {
  habitId: string;
  day: DayKey;
  count: number; // progress toward target
  completed: boolean;
  completedAt?: ISODate;
}

/* ---------------------------------------------------------------- Tasks -- */

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done";

export interface Task extends OwnedRecord {
  title: string;
  notes?: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Scheduled day (YYYY-MM-DD). Undefined = inbox / backlog (no date yet). */
  date?: DayKey;
  /** Optional deadline, independent of the scheduled day. */
  dueDate?: DayKey;
  completedAt?: ISODate;
  /** Sort order within its list (inbox or a given day). */
  order: number;
}

/* ------------------------------------------------------------ Nutrition -- */

export type MealSlot = "breakfast" | "midmorning" | "lunch" | "snack" | "dinner";
export const MEAL_SLOTS: MealSlot[] = ["breakfast", "midmorning", "lunch", "snack", "dinner"];

/** The four tracked macronutrient/energy values. */
export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * A reusable food the user created. Macros are expressed PER `per` `unit`
 * (e.g. per 100 g), so logging any quantity scales them. Built-in common foods
 * live in code (see lib/nutrition/foods-catalog) — this table is the user's own.
 */
export interface Food extends OwnedRecord, Macros {
  name: string;
  brand?: string;
  per: number; // reference amount the macros are given for (e.g. 100)
  unit: string; // "g" | "ml" | "unit"
  favorite: boolean;
  useCount: number; // surfaces frequently-used foods
}

/**
 * A food logged into a meal on a day. Its macros are a SNAPSHOT of the consumed
 * amount, so editing/deleting the source Food never rewrites diary history.
 */
export interface FoodEntry extends OwnedRecord, Macros {
  day: DayKey;
  meal: MealSlot;
  foodId?: string; // origin food (catalog:<id> or a user Food id) for reuse/frequency
  name: string;
  quantity: number;
  unit: string;
}

/* ------------------------------------------------------------- Exercise -- */

export type WorkoutSource = "manual" | "strava" | "suunto";

export interface Workout extends OwnedRecord {
  day: DayKey;
  activity: string; // preset key or free text
  durationMin?: number;
  distanceKm?: number;
  calories?: number; // energy burned
  notes?: string;
  source: WorkoutSource;
  externalId?: string; // stable id from an external provider (dedup on import)
}

/* --------------------------------------------- Nutrition configuration ---- */

export type NutritionTargets = Macros;
export type EnergyMode = "informational" | "adjustTarget";

export interface NutritionConfig {
  targets: NutritionTargets;
  /**
   * How exercise relates to the calorie target. `informational` (default) never
   * changes the target — it only shows burned/net. `adjustTarget` adds
   * burned × exerciseFactor to the effective target, transparently.
   */
  energyMode: EnergyMode;
  exerciseFactor: number; // 0..1
}

/* ----------------------------------------------------- Gamification -------- */

export interface GameState extends OwnedRecord {
  xp: number; // lifetime XP (drives level)
  spendableXp: number; // XP wallet usable in the shop
  level: number;
  lives: number; // 0..maxLives
  streakShields: number; // consumable streak protections
  /** Day the lives system was last reconciled, so we only evaluate each day once. */
  lastEvaluatedDay?: DayKey;
}

/** Append-only ledger. Positive = earned, negative = spent. */
export interface XpEvent extends OwnedRecord {
  amount: number;
  reason: string; // machine key, e.g. "habit.complete"
  meta?: Record<string, unknown>;
  day: DayKey;
}

export type FreeDayKind = "scheduled" | "purchased";

export interface FreeDay extends OwnedRecord {
  day: DayKey;
  kind: FreeDayKind;
  note?: string;
}

export type ShopItemId = "extra_life" | "free_day" | "streak_shield";

export interface ShopPurchase extends OwnedRecord {
  item: ShopItemId;
  cost: number;
  day: DayKey;
}

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

/** Static definition (lives in code, not the DB). */
export interface AchievementDef {
  id: string;
  category: Domain | "gamification" | "meta";
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  hidden: boolean;
  /** Progress target for milestone-style achievements (e.g. 100 habits). */
  goal?: number;
}

/** Per-user unlock state + running progress. */
export interface UserAchievement extends OwnedRecord {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: ISODate;
}

export type ChallengeStatus = "active" | "submitted" | "verified" | "failed";

export interface ChallengeEvidence {
  id: string;
  kind: "image" | "link" | "note";
  value: string; // data URL / object URL for images, or text
  filename?: string;
  addedAt: ISODate;
}

/** A challenge instance spun up when the user hits 0 lives. */
export interface Challenge extends OwnedRecord {
  defId: string;
  title: string;
  description: string;
  metricLabel: string; // e.g. "Distance (km)"
  status: ChallengeStatus;
  assignedDay: DayKey;
  evidence: ChallengeEvidence[];
  notes?: string;
  verifiedAt?: ISODate;
}

/* --------------------------------------------------------- Gamification cfg */

export interface XpRules {
  habitComplete: number;
  allHabitsBonus: number;
  taskLow: number;
  taskMedium: number;
  taskHigh: number;
  nutritionTarget: number;
}

export interface LivesRules {
  maxLives: number;
  /** Missing this many (or more) required habits in a non-free day costs a life. */
  missThreshold: number;
}

export interface ShopPrices {
  extra_life: number;
  free_day: number;
  streak_shield: number;
}

export interface GameConfig {
  xp: XpRules;
  lives: LivesRules;
  shop: ShopPrices;
}

/* ------------------------------------------------------------- Settings --- */

export type Locale = "en" | "es" | "ca";

export interface UserSettings extends OwnedRecord {
  locale: Locale;
  currency: string;
  heroMode: "auto" | "custom";
  heroImageUrl?: string;
  game: GameConfig;
  nutrition: NutritionConfig;
}
