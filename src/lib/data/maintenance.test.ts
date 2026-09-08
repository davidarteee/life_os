// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { resetLocalDatabase } from "@/lib/db/dexie";
import { createTask, listTasks } from "@/lib/data/tasks";
import { createEvent, listEvents } from "@/lib/data/events";
import { dedupeUserData } from "@/lib/data/maintenance";
import { dayKey } from "@/lib/date";

const UID = "12121212-1212-1212-1212-121212121212";
const OTHER = "34343434-3434-3434-3434-343434343434";
const TODAY = dayKey();
const tick = () => new Promise((r) => setTimeout(r, 5));

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("dedupeUserData", () => {
  it("removes identical duplicate tasks, keeping the earliest", async () => {
    const first = await createTask(UID, { title: "Buy milk", priority: "medium" });
    await tick();
    await createTask(UID, { title: "Buy milk", priority: "medium" }); // exact dup
    await createTask(UID, { title: "Buy milk", priority: "high" }); // different priority → kept

    const res = await dedupeUserData(UID);
    expect(res.tasks).toBe(1);
    const remaining = await listTasks(UID);
    expect(remaining).toHaveLength(2);
    expect(remaining.some((t) => t.id === first.id)).toBe(true); // earliest kept
  });

  it("removes identical duplicate events, keeping the earliest", async () => {
    await createEvent(UID, { title: "Dentist", date: TODAY, category: "medico", time: "10:00" });
    await tick();
    await createEvent(UID, { title: "Dentist", date: TODAY, category: "medico", time: "10:00" }); // dup
    await createEvent(UID, { title: "Dentist", date: TODAY, category: "medico", time: "18:00" }); // diff time → kept

    const res = await dedupeUserData(UID);
    expect(res.events).toBe(1);
    expect(await listEvents(UID)).toHaveLength(2);
  });

  it("does nothing when there are no duplicates", async () => {
    await createTask(UID, { title: "A" });
    await createTask(UID, { title: "B" });
    expect(await dedupeUserData(UID)).toEqual({ tasks: 0, events: 0 });
  });

  it("never touches another user's records", async () => {
    await createTask(UID, { title: "X" });
    await createTask(OTHER, { title: "X" }); // same title, different user — not a dup
    const res = await dedupeUserData(UID);
    expect(res.tasks).toBe(0);
    expect(await listTasks(OTHER)).toHaveLength(1);
  });
});
