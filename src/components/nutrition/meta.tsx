import { Coffee, Apple, UtensilsCrossed, Cookie, Soup, type LucideIcon } from "lucide-react";
import type { MealSlot } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

/** Meal-block metadata (label + icon), in the fixed 5-block daily order. */
export const MEAL_META: Record<MealSlot, { labelKey: DictKey; icon: LucideIcon }> = {
  breakfast: { labelKey: "nutrition.meal.breakfast", icon: Coffee },
  midmorning: { labelKey: "nutrition.meal.midmorning", icon: Apple },
  lunch: { labelKey: "nutrition.meal.lunch", icon: UtensilsCrossed },
  snack: { labelKey: "nutrition.meal.snack", icon: Cookie },
  dinner: { labelKey: "nutrition.meal.dinner", icon: Soup },
};

export type MacroKey = "calories" | "protein" | "carbs" | "fat";

/**
 * The four tracked values, each with a stable chart color (theme tokens from
 * globals.css) so the rings, legends and the dashboard widget all read as one
 * system. `unit` is "kcal" for energy, "g" for the macronutrients.
 */
export const MACRO_META: { key: MacroKey; labelKey: DictKey; unit: "kcal" | "g"; color: string }[] = [
  { key: "calories", labelKey: "nutrition.calories", unit: "kcal", color: "var(--primary)" },
  { key: "protein", labelKey: "nutrition.protein", unit: "g", color: "var(--chart-2)" },
  { key: "carbs", labelKey: "nutrition.carbs", unit: "g", color: "var(--chart-4)" },
  { key: "fat", labelKey: "nutrition.fat", unit: "g", color: "var(--chart-3)" },
];

export const MACRO_BY_KEY = new Map(MACRO_META.map((m) => [m.key, m]));

const UNIT_KEYS: Record<string, DictKey> = {
  g: "nutrition.unit.g",
  ml: "nutrition.unit.ml",
  unit: "nutrition.unit.unit",
};

/** Map a free-form unit string to its i18n key (defaults to grams). */
export function unitKey(unit: string): DictKey {
  return UNIT_KEYS[unit] ?? "nutrition.unit.g";
}
