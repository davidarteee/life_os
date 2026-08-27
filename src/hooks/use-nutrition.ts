"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import {
  entriesForDay, dayTotals, getNutritionConfig, targetsMet, recentFoods,
} from "@/lib/data/nutrition";
import { listFoods } from "@/lib/data/foods";
import { burnedForDay } from "@/lib/data/workouts";
import { computeEnergyBalance } from "@/lib/nutrition/energy";
import { emptyMacros, sumMacros } from "@/lib/nutrition/macros";
import { DEFAULT_NUTRITION_CONFIG } from "@/lib/nutrition/config";
import { MEAL_SLOTS } from "@/lib/types";
import { dayKey } from "@/lib/date";
import type { FoodEntry, MealSlot, Macros, NutritionConfig } from "@/lib/types";

export interface NutritionDay {
  entries: FoodEntry[];
  byMeal: Record<MealSlot, FoodEntry[]>;
  totals: Macros;
  config: NutritionConfig;
  burned: number;
  energy: ReturnType<typeof computeEnergyBalance>;
  targetsMet: boolean;
}

function groupByMeal(entries: FoodEntry[]): Record<MealSlot, FoodEntry[]> {
  const out = Object.fromEntries(MEAL_SLOTS.map((m) => [m, [] as FoodEntry[]])) as Record<MealSlot, FoodEntry[]>;
  for (const e of entries) out[e.meal].push(e);
  for (const m of MEAL_SLOTS) out[m].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return out;
}

/** Live nutrition state for a given day: meals, totals, targets, energy balance. */
export function useNutritionDay(day: string = dayKey()): NutritionDay {
  const uid = useUserId();
  const data = useLiveQuery(async () => {
    if (!uid) return null;
    const [entries, config, burned] = await Promise.all([
      entriesForDay(uid, day),
      getNutritionConfig(uid),
      burnedForDay(uid, day),
    ]);
    const totals = sumMacros(entries);
    return {
      entries,
      byMeal: groupByMeal(entries),
      totals,
      config,
      burned,
      energy: computeEnergyBalance(totals, burned, config),
      targetsMet: targetsMet(totals, config.targets),
    } satisfies NutritionDay;
  }, [uid, day]);

  const config = data?.config ?? structuredClone(DEFAULT_NUTRITION_CONFIG);
  const totals = data?.totals ?? emptyMacros();
  return (
    data ?? {
      entries: [],
      byMeal: groupByMeal([]),
      totals,
      config,
      burned: 0,
      energy: computeEnergyBalance(totals, 0, config),
      targetsMet: false,
    }
  );
}

/** Live: the user's own foods (favorites/frequency first). */
export function useFoods() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listFoods(uid) : []), [uid]) ?? [];
}

/** Live: recently-logged foods for quick re-adding. */
export function useRecentFoods(limit = 12) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? recentFoods(uid, limit) : []), [uid, limit]) ?? [];
}

/** Live nutrition config (targets + energy mode). */
export function useNutritionConfig() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? getNutritionConfig(uid) : null), [uid]) ?? null;
}

/** Live day totals only (for the dashboard widget). */
export function useDayTotals(day: string = dayKey()) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? dayTotals(uid, day) : emptyMacros()), [uid, day]) ?? emptyMacros();
}
