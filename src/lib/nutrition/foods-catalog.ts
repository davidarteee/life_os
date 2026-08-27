import type { Locale, Macros } from "@/lib/types";

/**
 * Built-in starter foods. Macros are per `per` `unit`. These live in code (no
 * per-user seeding, so nothing to duplicate across devices) and the food picker
 * shows them alongside the user's own foods. Logging one snapshots its macros
 * into a FoodEntry. Deliberately small and extensible — not a world food DB.
 */
export interface CatalogFood extends Macros {
  id: string;
  names: Record<Locale, string>;
  per: number;
  unit: string;
}

const F = (
  id: string,
  en: string, es: string, ca: string,
  per: number, unit: string,
  calories: number, protein: number, carbs: number, fat: number,
): CatalogFood => ({ id, names: { en, es, ca }, per, unit, calories, protein, carbs, fat });

export const FOODS_CATALOG: CatalogFood[] = [
  F("egg", "Egg", "Huevo", "Ou", 1, "unit", 78, 6.3, 0.6, 5.3),
  F("chicken_breast", "Chicken breast", "Pechuga de pollo", "Pit de pollastre", 100, "g", 165, 31, 0, 3.6),
  F("rice_cooked", "White rice (cooked)", "Arroz blanco (cocido)", "Arròs blanc (cuit)", 100, "g", 130, 2.7, 28, 0.3),
  F("pasta_cooked", "Pasta (cooked)", "Pasta (cocida)", "Pasta (cuita)", 100, "g", 131, 5, 25, 1.1),
  F("bread", "Bread", "Pan", "Pa", 100, "g", 265, 9, 49, 3.2),
  F("oats", "Oats", "Avena", "Civada", 100, "g", 389, 16.9, 66, 6.9),
  F("banana", "Banana", "Plátano", "Plàtan", 1, "unit", 105, 1.3, 27, 0.4),
  F("apple", "Apple", "Manzana", "Poma", 1, "unit", 95, 0.5, 25, 0.3),
  F("milk", "Milk", "Leche", "Llet", 100, "ml", 42, 3.4, 5, 1),
  F("greek_yogurt", "Greek yogurt", "Yogur griego", "Iogurt grec", 100, "g", 59, 10, 3.6, 0.4),
  F("olive_oil", "Olive oil", "Aceite de oliva", "Oli d'oliva", 100, "ml", 884, 0, 0, 100),
  F("almonds", "Almonds", "Almendras", "Ametlles", 100, "g", 579, 21, 22, 50),
  F("peanut_butter", "Peanut butter", "Crema de cacahuete", "Crema de cacauet", 100, "g", 588, 25, 20, 50),
  F("tuna_can", "Canned tuna", "Atún en lata", "Tonyina en llauna", 100, "g", 116, 26, 0, 1),
  F("salmon", "Salmon", "Salmón", "Salmó", 100, "g", 208, 20, 0, 13),
  F("potato", "Potato", "Patata", "Patata", 100, "g", 77, 2, 17, 0.1),
  F("broccoli", "Broccoli", "Brócoli", "Bròquil", 100, "g", 34, 2.8, 7, 0.4),
  F("lentils_cooked", "Lentils (cooked)", "Lentejas (cocidas)", "Llenties (cuites)", 100, "g", 116, 9, 20, 0.4),
  F("whey_scoop", "Whey protein (scoop)", "Proteína whey (cazo)", "Proteïna whey (mesura)", 1, "unit", 120, 24, 3, 1.5),
  F("coffee", "Coffee (black)", "Café solo", "Cafè sol", 100, "ml", 2, 0.1, 0, 0),
];

export const CATALOG_BY_ID = new Map(FOODS_CATALOG.map((f) => [f.id, f]));

/** Prefix marking a FoodEntry.foodId as coming from the built-in catalog. */
export const CATALOG_PREFIX = "catalog:";
