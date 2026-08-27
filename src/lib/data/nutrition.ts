import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import { getSettings, updateSettings } from "@/lib/data/settings";
import { bumpUseCount } from "@/lib/data/foods";
import { sumMacros } from "@/lib/nutrition/macros";
import { DEFAULT_NUTRITION_CONFIG } from "@/lib/nutrition/config";
import type { FoodEntry, MealSlot, Macros, NutritionConfig, NutritionTargets, DayKey } from "@/lib/types";
import { CATALOG_PREFIX } from "@/lib/nutrition/foods-catalog";

const entryOpts = (userId: string) => ({ table: db().foodEntries, syncTable: "food_entries" as const, userId });

/* ------------------------------------------------------------- Queries ---- */

export async function entriesForDay(userId: string, day: DayKey): Promise<FoodEntry[]> {
  return activeRecords(await db().foodEntries.where("[user_id+day]").equals([userId, day]).toArray());
}

export async function mealEntries(userId: string, day: DayKey, meal: MealSlot): Promise<FoodEntry[]> {
  return (await entriesForDay(userId, day)).filter((e) => e.meal === meal).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function dayTotals(userId: string, day: DayKey): Promise<Macros> {
  return sumMacros(await entriesForDay(userId, day));
}

/** Distinct recently-logged foods, newest first — for quick re-adding. */
export async function recentFoods(userId: string, limit = 12): Promise<FoodEntry[]> {
  const all = activeRecords(await db().foodEntries.where("user_id").equals(userId).toArray());
  all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const seen = new Set<string>();
  const out: FoodEntry[] = [];
  for (const e of all) {
    const key = e.foodId ?? e.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/* ----------------------------------------------------------- Mutations ---- */

export interface FoodEntryInput extends Macros {
  day: DayKey;
  meal: MealSlot;
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
}

export async function logFood(userId: string, input: FoodEntryInput): Promise<FoodEntry> {
  const entry = makeRecord<FoodEntry>(userId, {
    day: input.day,
    meal: input.meal,
    foodId: input.foodId,
    name: input.name.trim(),
    quantity: input.quantity,
    unit: input.unit,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
  });
  const saved = await upsert(entryOpts(userId), entry);
  // Track frequency of user foods (catalog ids aren't stored records).
  if (input.foodId && !input.foodId.startsWith(CATALOG_PREFIX)) {
    await bumpUseCount(userId, input.foodId).catch(() => {});
  }
  return saved;
}

export async function updateFoodEntry(userId: string, entry: FoodEntry): Promise<FoodEntry> {
  return upsert(entryOpts(userId), entry);
}

export async function removeFoodEntry(userId: string, id: string): Promise<void> {
  await softDelete(entryOpts(userId), id);
}

/* ------------------------------------------------------------- Config ----- */

export async function getNutritionConfig(userId: string): Promise<NutritionConfig> {
  const settings = await getSettings(userId);
  return settings.nutrition ?? structuredClone(DEFAULT_NUTRITION_CONFIG);
}

export async function setNutritionConfig(userId: string, nutrition: NutritionConfig): Promise<void> {
  await updateSettings(userId, { nutrition });
}

/**
 * "Targets met" for a day: calories within ±10% of the goal AND protein at
 * least 90% of its goal. Deliberately simple and transparent — it's the rule
 * that grants the daily nutrition XP.
 */
export function targetsMet(totals: Macros, targets: NutritionTargets): boolean {
  const calOk = targets.calories > 0 && totals.calories >= targets.calories * 0.9 && totals.calories <= targets.calories * 1.1;
  const proteinOk = targets.protein > 0 ? totals.protein >= targets.protein * 0.9 : true;
  return calOk && proteinOk;
}
