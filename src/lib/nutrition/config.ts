import type { NutritionConfig } from "@/lib/types";

/**
 * Default daily nutrition targets + energy-balance behaviour. Fully editable in
 * Settings. `informational` mode never touches the calorie target — it only
 * surfaces burned/net — which is the transparent default the user asked for.
 */
export const DEFAULT_NUTRITION_CONFIG: NutritionConfig = {
  targets: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  energyMode: "informational",
  exerciseFactor: 0.5,
};
