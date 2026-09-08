// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, resetLocalDatabase } from "@/lib/db/dexie";
import {
  createEvent, listEvents, eventsForDay, upcomingEvents, eventsInRange,
  updateEvent, deleteEvent, eventsCalendarItems,
} from "@/lib/data/events";
import { dayKey, shiftDayKey } from "@/lib/date";
import type { EventInput } from "@/lib/data/events";

const UID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const OTHER = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const TODAY = dayKey();

const ev = (over: Partial<EventInput> = {}): EventInput => ({
  title: "Dentist",
  date: TODAY,
  category: "medical",
  ...over,
});

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("events — CRUD and defaults", () => {
  it("creates an event with a category and no priority concept", async () => {
    const e = await createEvent(UID, ev());
    expect(e.title).toBe("Dentist");
    expect(e.category).toBe("medical");
    expect(e.date).toBe(TODAY);
    expect("priority" in e).toBe(false);
  });

  it("defaults the category to 'other' when unset", async () => {
    const e = await createEvent(UID, { title: "Something", date: TODAY });
    expect(e.category).toBe("other");
  });

  it("edits an event without creating a duplicate", async () => {
    const e = await createEvent(UID, ev());
    await updateEvent(UID, { ...e, title: "Doctor", category: "important" });
    const all = await listEvents(UID);
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("Doctor");
    expect(all[0].category).toBe("important");
  });

  it("soft-deletes (tombstone) and hides from active queries", async () => {
    const e = await createEvent(UID, ev());
    await deleteEvent(UID, e.id);
    expect(await listEvents(UID)).toHaveLength(0);
    expect((await db().events.get(e.id))?.deleted).toBe(true);
  });
});

describe("events — day / upcoming / range queries", () => {
  it("finds events for a specific day", async () => {
    await createEvent(UID, ev({ title: "A", date: TODAY }));
    await createEvent(UID, ev({ title: "B", date: shiftDayKey(TODAY, 3) }));
    expect(await eventsForDay(UID, TODAY)).toHaveLength(1);
    expect((await eventsForDay(UID, TODAY))[0].title).toBe("A");
  });

  it("sorts a day's events by time (timed first), then title", async () => {
    await createEvent(UID, ev({ title: "No time", date: TODAY }));
    await createEvent(UID, ev({ title: "Morning", date: TODAY, time: "09:00" }));
    await createEvent(UID, ev({ title: "Evening", date: TODAY, time: "20:00" }));
    const day = await eventsForDay(UID, TODAY);
    expect(day.map((e) => e.title)).toEqual(["Morning", "Evening", "No time"]);
  });

  it("upcoming includes today and future, excludes the past", async () => {
    await createEvent(UID, ev({ title: "Past", date: shiftDayKey(TODAY, -1) }));
    await createEvent(UID, ev({ title: "Today", date: TODAY }));
    await createEvent(UID, ev({ title: "Future", date: shiftDayKey(TODAY, 5) }));
    const up = await upcomingEvents(UID);
    expect(up.map((e) => e.title)).toEqual(["Today", "Future"]);
  });

  it("filters by a day-key range", async () => {
    await createEvent(UID, ev({ title: "In", date: TODAY }));
    await createEvent(UID, ev({ title: "Out", date: shiftDayKey(TODAY, 40) }));
    const inRange = await eventsInRange(UID, shiftDayKey(TODAY, -2), shiftDayKey(TODAY, 2));
    expect(inRange).toHaveLength(1);
    expect(inRange[0].title).toBe("In");
  });
});

describe("events — calendar contribution", () => {
  it("maps events to calendar items colored by category, prefixing the time", async () => {
    await createEvent(UID, ev({ title: "Exam", date: TODAY, time: "10:30", category: "exam" }));
    const items = await eventsCalendarItems(UID);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ day: TODAY, kind: "event", accent: "learning", href: "/events" });
    expect(items[0].title).toBe("10:30 Exam");
  });
});

describe("events — per-user isolation", () => {
  it("keeps events scoped by user_id", async () => {
    await createEvent(UID, ev({ title: "Mine" }));
    await createEvent(OTHER, ev({ title: "Theirs" }));
    expect(await listEvents(UID)).toHaveLength(1);
    expect(await listEvents(OTHER)).toHaveLength(1);
    expect(await eventsForDay(OTHER, TODAY)).toHaveLength(1);
    expect((await eventsCalendarItems(OTHER))[0].title).toBe("Theirs");
  });
});
