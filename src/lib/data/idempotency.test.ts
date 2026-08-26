// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, resetLocalDatabase } from "@/lib/db/dexie";
import { upsert, makeRecord, softDelete, activeRecords } from "@/lib/data/repository";
import { createHabit, listHabits, deleteHabit, allLogs } from "@/lib/data/habits";
import { deterministicId } from "@/lib/id";
import type { Habit } from "@/lib/types";

const UID = "11111111-1111-1111-1111-111111111111";
const SEED_KEYS = [
  "seed.sleep", "seed.exercise", "seed.stretch", "seed.read", "seed.coldShower",
  "seed.noCheat", "seed.meditate", "seed.write", "seed.nutrition",
];

/** Replicates the bootstrap seeding (deterministic ids) without the React/env layers. */
async function seedDefaults(userId: string) {
  for (const key of SEED_KEYS) {
    await createHabit(userId, { name: key, id: deterministicId(`${userId}:seed:${key}`) });
  }
}

const habitOpts = () => ({ table: db().habits, syncTable: "habits" as const, userId: UID });

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("record idempotency (regression: multi-device duplication)", () => {
  it("upserting the same id twice keeps exactly ONE row", async () => {
    const rec = makeRecord<Habit>(UID, {
      name: "Test", icon: "CircleCheck", color: "health", cadence: "daily",
      customDays: [], target: 1, xpReward: 10, required: true, active: true, order: 0,
    });
    await upsert(habitOpts(), rec);
    await upsert(habitOpts(), { ...rec, name: "Test edited" });

    const rows = await db().habits.where("user_id").equals(UID).toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Test edited"); // update, not insert
  });

  it("seeding the default habits TWICE produces 9 habits, not 18", async () => {
    await seedDefaults(UID);
    await seedDefaults(UID); // simulates a second device seeding before it pulled
    const habits = await listHabits(UID, true);
    expect(habits).toHaveLength(9);
  });

  it("two devices creating the SAME deterministic id converge to one record", async () => {
    const id = deterministicId(`${UID}:seed:seed.sleep`);
    // device A
    await createHabit(UID, { name: "Dormir 8 horas", id });
    // device B (independently, same deterministic id)
    await createHabit(UID, { name: "Dormir 8 horas", id });
    const rows = await db().habits.where("user_id").equals(UID).toArray();
    expect(rows).toHaveLength(1);
  });

  it("user-created habits (no explicit id) are NEVER deduplicated", async () => {
    await createHabit(UID, { name: "Custom habit" });
    await createHabit(UID, { name: "Custom habit" }); // same name, different intent
    const habits = await listHabits(UID, true);
    expect(habits).toHaveLength(2);
    expect(habits[0].id).not.toBe(habits[1].id);
  });
});

describe("soft delete is convergent (never resurrects)", () => {
  it("marks a tombstone and hides it from active queries", async () => {
    const habit = await createHabit(UID, { name: "To delete" });
    await deleteHabit(UID, habit.id);

    const raw = await db().habits.get(habit.id);
    expect(raw?.deleted).toBe(true); // tombstone kept for sync convergence

    const active = activeRecords(await db().habits.where("user_id").equals(UID).toArray());
    expect(active).toHaveLength(0); // hidden from the app

    // Re-deleting is idempotent (no error, still one tombstone).
    await softDelete(habitOpts(), habit.id);
    const all = await db().habits.where("user_id").equals(UID).toArray();
    expect(all).toHaveLength(1);
  });

  it("keeps data isolated per user", async () => {
    const other = "22222222-2222-2222-2222-222222222222";
    await createHabit(UID, { name: "Mine" });
    await createHabit(other, { name: "Theirs" });
    expect(await listHabits(UID, true)).toHaveLength(1);
    expect(await listHabits(other, true)).toHaveLength(1);
    expect(await allLogs(UID)).toHaveLength(0);
  });
});
