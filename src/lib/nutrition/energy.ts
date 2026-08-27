import type { Macros, NutritionConfig } from "@/lib/types";

/**
 * Transparent, configurable energy balance. Pure and unit-tested.
 *
 * `informational` mode never changes the calorie target — it only reports what
 * was burned and the net (consumed − burned). `adjustTarget` adds
 * burned × exerciseFactor to the target, and we always expose every input so
 * the UI can show the exact formula (no hidden auto-adjustment).
 */
export interface EnergyBalance {
  targetCalories: number;
  effectiveTarget: number;
  consumed: number;
  burned: number;
  net: number; // consumed − burned
  remaining: number; // effectiveTarget − consumed
  mode: NutritionConfig["energyMode"];
  factor: number;
  /** Calories added to the target by exercise (0 in informational mode). */
  exerciseCredit: number;
}

export function computeEnergyBalance(
  consumed: Macros,
  burned: number,
  config: NutritionConfig,
): EnergyBalance {
  const target = config.targets.calories;
  const factor = Math.max(0, Math.min(1, config.exerciseFactor));
  const exerciseCredit = config.energyMode === "adjustTarget" ? Math.round(burned * factor) : 0;
  const effectiveTarget = target + exerciseCredit;
  return {
    targetCalories: target,
    effectiveTarget,
    consumed: consumed.calories,
    burned,
    net: consumed.calories - burned,
    remaining: effectiveTarget - consumed.calories,
    mode: config.energyMode,
    factor,
    exerciseCredit,
  };
}
