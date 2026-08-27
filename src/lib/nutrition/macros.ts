import type { Macros } from "@/lib/types";

export const emptyMacros = (): Macros => ({ calories: 0, protein: 0, carbs: 0, fat: 0 });

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Scale every macro by a factor (e.g. consumed quantity ÷ reference amount). */
export function scaleMacros(base: Macros, factor: number): Macros {
  return {
    calories: Math.round(base.calories * factor),
    protein: round1(base.protein * factor),
    carbs: round1(base.carbs * factor),
    fat: round1(base.fat * factor),
  };
}

/**
 * Macros for a consumed `quantity` of a food whose macros are given per `per`
 * units (e.g. 150 g of a food defined per 100 g → factor 1.5).
 */
export function macrosForQuantity(base: Macros, per: number, quantity: number): Macros {
  return scaleMacros(base, per > 0 ? quantity / per : 0);
}

/** Sum a list of macro-bearing rows. */
export function sumMacros(rows: Macros[]): Macros {
  return rows.reduce<Macros>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: round1(acc.protein + m.protein),
      carbs: round1(acc.carbs + m.carbs),
      fat: round1(acc.fat + m.fat),
    }),
    emptyMacros(),
  );
}

/** 0..1 progress of a value toward a target (0 target → 0). */
export function progress(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}
