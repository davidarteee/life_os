// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, resetLocalDatabase } from "@/lib/db/dexie";
import {
  logFood, entriesForDay, mealEntries, dayTotals, removeFoodEntry, recentFoods, targetsMet,
  getNutritionConfig, setNutritionConfig,
} from "@/lib/data/nutrition";
import { createFood, listFoods, deleteFood, bumpUseCount } from "@/lib/data/foods";
import { createWorkout, workoutsForDay, burnedForDay, listWorkouts } from "@/lib/data/workouts";
import { DEFAULT_NUTRITION_CONFIG } from "@/lib/nutrition/config";
import { CATALOG_PREFIX } from "@/lib/nutrition/foods-catalog";
import { dayKey } from "@/lib/date";
import type { FoodEntryInput } from "@/lib/data/nutrition";

const UID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const TODAY = dayKey();

const entry = (over: Partial<FoodEntryInput> = {}): FoodEntryInput => ({
  day: TODAY,
  meal: "lunch",
  name: "Chicken",
  quantity: 100,
  unit: "g",
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  ...over,
});

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("nutrition — logging and day totals", () => {
  it("logs a food into a meal and finds it for that day", async () => {
    await logFood(UID, entry());
    const dayEntries = await entriesForDay(UID, TODAY);
    expect(dayEntries).toHaveLength(1);
    expect(await mealEntries(UID, TODAY, "lunch")).toHaveLength(1);
    expect(await mealEntries(UID, TODAY, "dinner")).toHaveLength(0);
  });

  it("sums the day's macros across meals", async () => {
    await logFood(UID, entry({ meal: "breakfast", calories: 200, protein: 10, carbs: 30, fat: 5 }));
    await logFood(UID, entry({ meal: "lunch", calories: 500, protein: 40, carbs: 50, fat: 15 }));
    const totals = await dayTotals(UID, TODAY);
    expect(totals).toEqual({ calories: 700, protein: 50, carbs: 80, fat: 20 });
  });

  it("removing an entry (tombstone) drops it from the day", async () => {
    const e = await logFood(UID, entry());
    await removeFoodEntry(UID, e.id);
    expect(await entriesForDay(UID, TODAY)).toHaveLength(0);
    const raw = await db().foodEntries.get(e.id);
    expect(raw?.deleted).toBe(true); // tombstone kept for sync convergence
  });

  it("snapshots macros so history is independent of the source food", async () => {
    const e = await logFood(UID, entry({ foodId: "someFood", calories: 300 }));
    expect(e.calories).toBe(300); // stored on the entry, not referenced live
  });
});

describe("nutrition — targets met rule", () => {
  const targets = DEFAULT_NUTRITION_CONFIG.targets; // cal 2000, protein 150

  it("is met when calories are within ±10% and protein ≥ 90%", () => {
    expect(targetsMet({ calories: 2000, protein: 150, carbs: 0, fat: 0 }, targets)).toBe(true);
    expect(targetsMet({ calories: 1850, protein: 140, carbs: 0, fat: 0 }, targets)).toBe(true);
  });

  it("fails when calories are too low/high or protein is short", () => {
    expect(targetsMet({ calories: 1500, protein: 150, carbs: 0, fat: 0 }, targets)).toBe(false);
    expect(targetsMet({ calories: 2500, protein: 150, carbs: 0, fat: 0 }, targets)).toBe(false);
    expect(targetsMet({ calories: 2000, protein: 100, carbs: 0, fat: 0 }, targets)).toBe(false);
  });
});

describe("nutrition — config", () => {
  it("returns defaults, then persists an update", async () => {
    expect((await getNutritionConfig(UID)).energyMode).toBe("informational");
    await setNutritionConfig(UID, { ...DEFAULT_NUTRITION_CONFIG, energyMode: "adjustTarget", exerciseFactor: 0.3 });
    const cfg = await getNutritionConfig(UID);
    expect(cfg.energyMode).toBe("adjustTarget");
    expect(cfg.exerciseFactor).toBe(0.3);
  });
});

describe("nutrition — user foods", () => {
  it("creates a user food and lists favorites/frequency first", async () => {
    await createFood(UID, { name: "Oats", per: 100, unit: "g", calories: 389, protein: 17, carbs: 66, fat: 7 });
    const fav = await createFood(UID, { name: "Whey", per: 1, unit: "unit", calories: 120, protein: 24, carbs: 3, fat: 1.5, favorite: true });
    const list = await listFoods(UID);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(fav.id); // favorite sorts first
  });

  it("bumps use count only for the owning user's food", async () => {
    const f = await createFood(UID, { name: "Rice", per: 100, unit: "g", calories: 130, protein: 3, carbs: 28, fat: 0 });
    await bumpUseCount(UID, f.id);
    await bumpUseCount(OTHER, f.id); // wrong owner → ignored
    expect((await db().foods.get(f.id))?.useCount).toBe(1);
  });

  it("soft-deletes a food (history entries are unaffected — they snapshot macros)", async () => {
    const f = await createFood(UID, { name: "Temp", per: 100, unit: "g", calories: 100, protein: 1, carbs: 1, fat: 1 });
    await logFood(UID, entry({ foodId: f.id }));
    await deleteFood(UID, f.id);
    expect(await listFoods(UID)).toHaveLength(0);
    expect(await entriesForDay(UID, TODAY)).toHaveLength(1); // diary intact
  });
});

describe("nutrition — recent foods", () => {
  it("returns distinct recently-logged foods, newest first", async () => {
    // Space the logs so created_at is strictly increasing (ordering is by time;
    // ties within the same millisecond would make "newest first" ambiguous).
    const tick = () => new Promise((r) => setTimeout(r, 5));
    await logFood(UID, entry({ name: "A", foodId: "a" }));
    await tick();
    await logFood(UID, entry({ name: "B", foodId: "b" }));
    await tick();
    await logFood(UID, entry({ name: "A again", foodId: "a" })); // same origin → deduped
    const recent = await recentFoods(UID);
    expect(recent.map((r) => r.foodId)).toEqual(["a", "b"]);
  });
});

describe("nutrition — catalog is code-only (no seeding, nothing to duplicate)", () => {
  it("logging a catalog food does NOT create a Food record", async () => {
    await logFood(UID, entry({ foodId: `${CATALOG_PREFIX}egg`, name: "Egg" }));
    expect(await listFoods(UID)).toHaveLength(0); // catalog lives in code, not the DB
    expect(await entriesForDay(UID, TODAY)).toHaveLength(1);
  });
});

describe("exercise — manual log", () => {
  it("logs a workout and finds it for the day", async () => {
    await createWorkout(UID, { day: TODAY, activity: "run", durationMin: 30, distanceKm: 5, calories: 300 });
    const today = await workoutsForDay(UID, TODAY);
    expect(today).toHaveLength(1);
    expect(today[0].source).toBe("manual");
    expect(await burnedForDay(UID, TODAY)).toBe(300);
  });

  it("defaults source to manual and activity to a value", async () => {
    const w = await createWorkout(UID, { day: TODAY, activity: "" });
    expect(w.source).toBe("manual");
    expect(w.activity).toBe("other");
  });
});

describe("nutrition & exercise — per-user isolation", () => {
  it("keeps entries, foods and workouts scoped by user_id", async () => {
    await logFood(UID, entry());
    await createFood(UID, { name: "Mine", per: 100, unit: "g", calories: 1, protein: 1, carbs: 1, fat: 1 });
    await createWorkout(UID, { day: TODAY, activity: "gym" });

    expect(await entriesForDay(OTHER, TODAY)).toHaveLength(0);
    expect(await listFoods(OTHER)).toHaveLength(0);
    expect(await listWorkouts(OTHER)).toHaveLength(0);
    // owner still sees their own
    expect(await entriesForDay(UID, TODAY)).toHaveLength(1);
    expect(await listWorkouts(UID)).toHaveLength(1);
  });
});
