import type { Table } from "dexie";
import type { SupabaseClient } from "@supabase/supabase-js";
import { db, type SyncTable } from "@/lib/db/dexie";
import type { OwnedRecord } from "@/lib/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Offline sync engine.
 *
 * Storage model: every entity maps to a Supabase table with columns
 *   (id uuid pk, user_id uuid, updated_at timestamptz, deleted bool, data jsonb)
 * where `data` is the full offline record. This keeps the client record shape
 * identical on both sides, makes RLS uniform (user_id = auth.uid()), and makes
 * conflict resolution a simple last-write-wins on updated_at — the right
 * trade-off for a single-user-per-account, offline-first app. (Rationale and
 * the future-normalization path are documented in docs/ARCHITECTURE.md.)
 */

interface TableBinding {
  local: () => Table<OwnedRecord, string>;
  remote: string;
}

const REGISTRY: Record<SyncTable, TableBinding> = {
  habits: { local: () => db().habits as unknown as Table<OwnedRecord, string>, remote: "habits" },
  habit_logs: { local: () => db().habitLogs as unknown as Table<OwnedRecord, string>, remote: "habit_logs" },
  game_state: { local: () => db().gameState as unknown as Table<OwnedRecord, string>, remote: "game_state" },
  xp_events: { local: () => db().xpEvents as unknown as Table<OwnedRecord, string>, remote: "xp_events" },
  free_days: { local: () => db().freeDays as unknown as Table<OwnedRecord, string>, remote: "free_days" },
  shop_purchases: { local: () => db().shopPurchases as unknown as Table<OwnedRecord, string>, remote: "shop_purchases" },
  user_achievements: { local: () => db().userAchievements as unknown as Table<OwnedRecord, string>, remote: "user_achievements" },
  challenges: { local: () => db().challenges as unknown as Table<OwnedRecord, string>, remote: "challenges" },
  user_settings: { local: () => db().settings as unknown as Table<OwnedRecord, string>, remote: "user_settings" },
  tasks: { local: () => db().tasks as unknown as Table<OwnedRecord, string>, remote: "tasks" },
  foods: { local: () => db().foods as unknown as Table<OwnedRecord, string>, remote: "foods" },
  food_entries: { local: () => db().foodEntries as unknown as Table<OwnedRecord, string>, remote: "food_entries" },
  workouts: { local: () => db().workouts as unknown as Table<OwnedRecord, string>, remote: "workouts" },
};

const LAST_PULL_KEY = (userId: string) => `lifeos:lastPull:${userId}`;

/**
 * Last-write-wins conflict resolution (pure, unit-tested). A remote record is
 * applied only when there is no local copy, or the remote copy is strictly
 * newer by `updated_at`. Equal timestamps keep the local copy — this makes pull
 * idempotent (re-pulling the same rows never rewrites them and never resurrects
 * a locally-newer edit or delete).
 */
export function shouldApplyRemote(
  local: { updated_at: string } | undefined | null,
  remote: { updated_at: string },
): boolean {
  return !local || remote.updated_at > local.updated_at;
}

function toRow(record: OwnedRecord & { _dirty?: boolean }) {
  const { _dirty, ...clean } = record;
  void _dirty;
  return {
    id: clean.id,
    user_id: clean.user_id,
    updated_at: clean.updated_at,
    deleted: !!clean.deleted,
    data: clean,
  };
}

export interface SyncReport {
  pushed: number;
  pulled: number;
  errors: number;
}

/** Push every queued mutation for a user to the cloud, oldest first. */
async function push(supabase: SupabaseClient, userId: string): Promise<{ pushed: number; errors: number }> {
  const pending = await db().mutations.where("user_id").equals(userId).sortBy("createdAt");
  let pushed = 0;
  let errors = 0;

  for (const mutation of pending) {
    const binding = REGISTRY[mutation.table];
    if (!binding) continue;
    const payload = mutation.payload as OwnedRecord;
    const { error } = await supabase.from(binding.remote).upsert(toRow(payload), { onConflict: "id" });
    if (error) {
      errors += 1;
      await db().mutations.update(mutation.id, { attempts: mutation.attempts + 1 });
      continue;
    }
    await db().mutations.delete(mutation.id);
    pushed += 1;
  }
  return { pushed, errors };
}

/** Pull remote rows updated since the last successful pull and merge them in. */
async function pull(supabase: SupabaseClient, userId: string): Promise<{ pulled: number; errors: number }> {
  const since = typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PULL_KEY(userId)) : null;
  const cutoff = since ?? "1970-01-01T00:00:00.000Z";
  let pulled = 0;
  let errors = 0;
  let maxSeen = cutoff;

  for (const table of Object.keys(REGISTRY) as SyncTable[]) {
    const binding = REGISTRY[table];
    const { data, error } = await supabase
      .from(binding.remote)
      .select("id, updated_at, data")
      .eq("user_id", userId)
      .gt("updated_at", cutoff)
      .order("updated_at", { ascending: true })
      .limit(1000);

    if (error) {
      errors += 1;
      continue;
    }
    const localTable = binding.local();
    for (const row of data ?? []) {
      const remoteRecord = row.data as OwnedRecord;
      const local = await localTable.get(remoteRecord.id);
      // Last-write-wins: only overwrite if the remote copy is newer.
      if (shouldApplyRemote(local, remoteRecord)) {
        await localTable.put({ ...remoteRecord, _dirty: false });
      }
      if (row.updated_at > maxSeen) maxSeen = row.updated_at;
      pulled += 1;
    }
  }

  if (typeof localStorage !== "undefined" && maxSeen > cutoff) {
    localStorage.setItem(LAST_PULL_KEY(userId), maxSeen);
  }
  return { pulled, errors };
}

/**
 * Seed the outbox with every existing local record for a user. Runs once when
 * cloud sync is first connected on a device that was previously in local mode
 * (its writes never queued), so nothing is left behind on the device.
 */
async function backfillOutbox(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const database = db();
  for (const table of Object.keys(REGISTRY) as SyncTable[]) {
    const rows = await REGISTRY[table].local().where("user_id").equals(userId).toArray();
    for (const record of rows) {
      await database.mutations.add({
        id: crypto.randomUUID(),
        user_id: userId,
        table,
        op: record.deleted ? "delete" : "upsert",
        recordId: record.id,
        payload: (({ _dirty, ...rest }) => { void _dirty; return rest; })(record as OwnedRecord & { _dirty?: boolean }),
        createdAt: now,
        attempts: 0,
      });
    }
  }
}

let syncing = false;

/**
 * Run one full sync cycle (push then pull). No-op when Supabase is unconfigured,
 * offline, or a sync is already in flight. Safe to call opportunistically.
 */
export async function runSync(userId: string): Promise<SyncReport> {
  const supabase = getSupabaseBrowser();
  if (!supabase || syncing) return { pushed: 0, pulled: 0, errors: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { pushed: 0, pulled: 0, errors: 0 };

  syncing = true;
  try {
    // First connection on a formerly-local device: seed the outbox once.
    const firstSync = typeof localStorage !== "undefined" && !localStorage.getItem(LAST_PULL_KEY(userId));
    if (firstSync && (await db().mutations.where("user_id").equals(userId).count()) === 0) {
      await backfillOutbox(userId);
    }
    const pushRes = await push(supabase, userId);
    const pullRes = await pull(supabase, userId);
    return {
      pushed: pushRes.pushed,
      pulled: pullRes.pulled,
      errors: pushRes.errors + pullRes.errors,
    };
  } finally {
    syncing = false;
  }
}

export async function pendingMutationCount(userId: string): Promise<number> {
  return db().mutations.where("user_id").equals(userId).count();
}
