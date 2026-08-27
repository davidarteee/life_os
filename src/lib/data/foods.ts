import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import type { Food } from "@/lib/types";

const foodOpts = (userId: string) => ({ table: db().foods, syncTable: "foods" as const, userId });

export async function listFoods(userId: string): Promise<Food[]> {
  return activeRecords(await db().foods.where("user_id").equals(userId).toArray()).sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || b.useCount - a.useCount || a.name.localeCompare(b.name),
  );
}

export interface FoodInput {
  name: string;
  brand?: string;
  per: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  favorite?: boolean;
}

export async function createFood(userId: string, input: FoodInput): Promise<Food> {
  const food = makeRecord<Food>(userId, {
    name: input.name.trim(),
    brand: input.brand?.trim() || undefined,
    per: Math.max(1, input.per),
    unit: input.unit || "g",
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    favorite: input.favorite ?? false,
    useCount: 0,
  });
  return upsert(foodOpts(userId), food);
}

export async function updateFood(userId: string, food: Food): Promise<Food> {
  return upsert(foodOpts(userId), food);
}

export async function deleteFood(userId: string, id: string): Promise<void> {
  await softDelete(foodOpts(userId), id);
}

export async function toggleFavorite(userId: string, food: Food): Promise<Food> {
  return upsert(foodOpts(userId), { ...food, favorite: !food.favorite });
}

/** Bump a user food's usage counter (surfaces frequently-used foods). */
export async function bumpUseCount(userId: string, foodId: string): Promise<void> {
  const food = await db().foods.get(foodId);
  if (food && !food.deleted && food.user_id === userId) {
    await upsert(foodOpts(userId), { ...food, useCount: food.useCount + 1 });
  }
}
