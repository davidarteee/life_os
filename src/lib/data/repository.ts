import type { Table } from "dexie";
import { db, type SyncTable, type Mutation } from "@/lib/db/dexie";
import type { OwnedRecord } from "@/lib/types";
import { newId } from "@/lib/id";
import { isSupabaseConfigured } from "@/config/env";

/**
 * Thin write-through repository. Every mutation:
 *   1. writes to the local Dexie table (source of truth), and
 *   2. appends to the `mutations` outbox so the sync engine can push it later.
 *
 * Timestamps and the local `_dirty` flag are stamped here so callers never
 * have to remember. The outbox write is in the same Dexie transaction as the
 * data write, so we never persist a change without also queuing its sync.
 */

const nowISO = () => new Date().toISOString();

function enqueue(mutation: Omit<Mutation, "id" | "createdAt" | "attempts">): Mutation {
  return { ...mutation, id: newId(), createdAt: nowISO(), attempts: 0 };
}

export interface RepoOptions {
  table: Table<OwnedRecord, string>;
  syncTable: SyncTable;
  userId: string;
}

export async function upsert<T extends OwnedRecord>(
  opts: { table: Table<T, string>; syncTable: SyncTable; userId: string },
  record: T,
): Promise<T> {
  const database = db();
  const stamped: T = {
    ...record,
    user_id: opts.userId,
    updated_at: nowISO(),
    created_at: record.created_at || nowISO(),
    _dirty: true,
  };
  await database.transaction("rw", opts.table, database.mutations, async () => {
    await opts.table.put(stamped);
    // Only queue for sync when a cloud backend exists to receive it. In local
    // mode the outbox would grow unbounded with nothing to drain it; a full
    // backfill runs when cloud sync is first connected (see sync-engine).
    if (isSupabaseConfigured) {
      await database.mutations.add(
        enqueue({
          user_id: opts.userId,
          table: opts.syncTable,
          op: "upsert",
          recordId: stamped.id,
          payload: stripLocalFields(stamped),
        }),
      );
    }
  });
  return stamped;
}

export async function softDelete<T extends OwnedRecord>(
  opts: { table: Table<T, string>; syncTable: SyncTable; userId: string },
  id: string,
): Promise<void> {
  const database = db();
  const existing = await opts.table.get(id);
  if (!existing) return;
  const tombstone: T = { ...existing, deleted: true, updated_at: nowISO(), _dirty: true };
  await database.transaction("rw", opts.table, database.mutations, async () => {
    await opts.table.put(tombstone);
    if (isSupabaseConfigured) {
      await database.mutations.add(
        enqueue({
          user_id: opts.userId,
          table: opts.syncTable,
          op: "delete",
          recordId: id,
          payload: stripLocalFields(tombstone),
        }),
      );
    }
  });
}

/** Build a fresh record shell with ids + timestamps filled in. */
export function makeRecord<T extends OwnedRecord>(userId: string, partial: Omit<T, keyof OwnedRecord> & Partial<OwnedRecord>): T {
  const ts = nowISO();
  return {
    id: partial.id ?? newId(),
    user_id: userId,
    created_at: partial.created_at ?? ts,
    updated_at: ts,
    ...partial,
  } as T;
}

/** Remove client-only fields before a record leaves the device. */
export function stripLocalFields<T extends OwnedRecord>(record: T): Omit<T, "_dirty"> {
  const clone = { ...record };
  delete clone._dirty;
  return clone;
}

/** Live query helper: non-deleted records for a user. */
export function activeRecords<T extends OwnedRecord>(rows: T[]): T[] {
  return rows.filter((r) => !r.deleted);
}
