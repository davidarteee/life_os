// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, resetLocalDatabase } from "@/lib/db/dexie";
import { reconcileNutrition } from "@/lib/data/actions";
import { logFood, removeFoodEntry } from "@/lib/data/nutrition";
import { createWorkout } from "@/lib/data/workouts";
import { readGameState, listXpEvents } from "@/lib/data/game";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/config";
import { XP_REASON } from "@/lib/game/config";
import { activeRecords } from "@/lib/data/repository";
import { dayKey } from "@/lib/date";
import type { FoodEntryInput } from "@/lib/data/nutrition";

const UID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const OTHER = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const TODAY = dayKey();
const XP = DEFAULT_GAME_CONFIG.xp.nutritionTarget;

/** A single entry that meets the default targets (2000 kcal / 150 g protein). */
const onTarget = (over: Partial<FoodEntryInput> = {}): FoodEntryInput => ({
  day: TODAY,
  meal: "lunch",
  name: "Full day",
  quantity: 1,
  unit: "unit",
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  ...over,
});

async function netNutritionXp(userId: string, day = TODAY): Promise<number> {
  const events = activeRecords(await db().xpEvents.where("[user_id+day]").equals([userId, day]).toArray());
  return events.filter((e) => e.reason === XP_REASON.nutritionTarget).reduce((s, e) => s + e.amount, 0);
}

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("nutrition XP — reconcile is idempotent (regression: double-count)", () => {
  it("awards the nutrition-target XP exactly once when the day hits target", async () => {
    await logFood(UID, onTarget());

    const first = await reconcileNutrition(UID, TODAY, DEFAULT_GAME_CONFIG);
    expect(first.targetsMet).toBe(true);
    expect(first.xpDelta).toBe(XP);

    // Reconciling again (e.g. after another food edit) must NOT award again.
    const second = await reconcileNutrition(UID, TODAY, DEFAULT_GAME_CONFIG);
    expect(second.xpDelta).toBe(0);

    expect(await netNutritionXp(UID)).toBe(XP); // net one award (reason-scoped)
  });

  it("reverses the XP when a later edit drops the day below target", async () => {
    const e = await logFood(UID, onTarget());
    await reconcileNutrition(UID, TODAY, DEFAULT_GAME_CONFIG);
    expect(await netNutritionXp(UID)).toBe(XP);

    // Remove the food → day no longer meets target → XP reversed.
    await removeFoodEntry(UID, e.id);
    const reverted = await reconcileNutrition(UID, TODAY, DEFAULT_GAME_CONFIG);
    expect(reverted.targetsMet).toBe(false);
    expect(reverted.xpDelta).toBe(-XP);
    expect(await netNutritionXp(UID)).toBe(0); // target XP fully reversed
  });

  it("does not award XP for a day below target", async () => {
    await logFood(UID, onTarget({ calories: 800, protein: 40 })); // well under
    const r = await reconcileNutrition(UID, TODAY, DEFAULT_GAME_CONFIG);
    expect(r.targetsMet).toBe(false);
    expect(r.xpDelta).toBe(0);
    expect(await netNutritionXp(UID)).toBe(0);
  });
});

describe("exercise earns NO XP (no double reward vs the do-sport habit)", () => {
  it("logging a workout creates no XP events", async () => {
    await createWorkout(UID, { day: TODAY, activity: "run", durationMin: 45, calories: 500 });
    expect(await listXpEvents(UID)).toHaveLength(0);
    expect(await readGameState(UID)).toBeNull(); // no game state provisioned by exercise
  });
});

describe("nutrition XP — per-user isolation", () => {
  it("one user's on-target day never awards XP to another user", async () => {
    await logFood(UID, onTarget());
    await reconcileNutrition(UID, TODAY, DEFAULT_GAME_CONFIG);

    // OTHER has no food logged → nothing to award, and UID is untouched.
    const other = await reconcileNutrition(OTHER, TODAY, DEFAULT_GAME_CONFIG);
    expect(other.xpDelta).toBe(0);
    expect(await netNutritionXp(OTHER)).toBe(0);
    expect(await netNutritionXp(UID)).toBe(XP);
  });
});
