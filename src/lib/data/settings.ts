import { db } from "@/lib/db/dexie";
import { upsert, makeRecord } from "@/lib/data/repository";
import type { UserSettings } from "@/lib/types";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/config";
import { DEFAULT_NUTRITION_CONFIG } from "@/lib/nutrition/config";
import { deterministicId } from "@/lib/id";

const settingsOpts = (userId: string) => ({
  table: db().settings,
  syncTable: "user_settings" as const,
  userId,
});

export function defaultSettings(userId: string): UserSettings {
  // id is a real UUID (makeRecord generates one). There's exactly one settings
  // row per user; it's always looked up by user_id, never by a derived id — a
  // non-UUID id would be rejected by the Supabase `id uuid` column and never sync.
  return makeRecord<UserSettings>(userId, {
    id: deterministicId(`${userId}:user_settings`),
    locale: "es",
    currency: "EUR",
    heroMode: "auto",
    game: structuredClone(DEFAULT_GAME_CONFIG),
    nutrition: structuredClone(DEFAULT_NUTRITION_CONFIG),
  });
}

/**
 * Read-only settings lookup — safe inside a Dexie liveQuery (never writes).
 * Returns null when not yet provisioned; ensureUserData() handles creation.
 */
export async function readSettings(userId: string): Promise<UserSettings | null> {
  return (await db().settings.where("user_id").equals(userId).first()) ?? null;
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const existing = await db().settings.where("user_id").equals(userId).first();
  if (existing) return existing;
  const created = defaultSettings(userId);
  await upsert(settingsOpts(userId), created);
  return created;
}

export async function updateSettings(
  userId: string,
  patch: Partial<Omit<UserSettings, keyof import("@/lib/types").OwnedRecord>>,
): Promise<UserSettings> {
  const current = await getSettings(userId);
  const next = { ...current, ...patch };
  return upsert(settingsOpts(userId), next);
}
