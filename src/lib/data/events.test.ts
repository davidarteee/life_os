// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, resetLocalDatabase } from "@/lib/db/dexie";
import {
  createEvent, listEvents, eventsForDay, upcomingEventOccurrences,
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
  category: "medico",
  ...over,
});

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("events — CRUD and defaults", () => {
  it("creates an event with a category and no priority concept", async () => {
    const e = await createEvent(UID, ev());
    expect(e.category).toBe("medico");
    expect("priority" in e).toBe(false);
  });

  it("defaults the category to 'otros' when unset", async () => {
    const e = await createEvent(UID, { title: "Something", date: TODAY });
    expect(e.category).toBe("otros");
  });

  it("edits an event without creating a duplicate", async () => {
    const e = await createEvent(UID, ev());
    await updateEvent(UID, { ...e, title: "Doctor", category: "personal" });
    const all = await listEvents(UID);
    expect(all).toHaveLength(1);
    expect(all[0].category).toBe("personal");
  });

  it("soft-deletes (tombstone) and hides from active queries", async () => {
    const e = await createEvent(UID, ev());
    await deleteEvent(UID, e.id);
    expect(await listEvents(UID)).toHaveLength(0);
    expect((await db().events.get(e.id))?.deleted).toBe(true);
  });
});

describe("events — day / upcoming queries", () => {
  it("finds one-off events for a specific day", async () => {
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

  it("upcoming lists the next occurrence per event, soonest first", async () => {
    await createEvent(UID, ev({ title: "Past", date: shiftDayKey(TODAY, -1) }));
    await createEvent(UID, ev({ title: "Today", date: TODAY }));
    await createEvent(UID, ev({ title: "Future", date: shiftDayKey(TODAY, 5) }));
    const up = await upcomingEventOccurrences(UID);
    expect(up.map((o) => o.event.title)).toEqual(["Today", "Future"]);
  });
});

describe("events — recurrence", () => {
  it("a weekly event occurs on its start and every following week", async () => {
    await createEvent(UID, ev({ title: "Class", date: TODAY, repeat: { freq: "weekly", interval: 1 } }));
    expect(await eventsForDay(UID, TODAY)).toHaveLength(1);
    expect(await eventsForDay(UID, shiftDayKey(TODAY, 7))).toHaveLength(1);
    expect(await eventsForDay(UID, shiftDayKey(TODAY, 14))).toHaveLength(1);
    expect(await eventsForDay(UID, shiftDayKey(TODAY, 3))).toHaveLength(0); // not on off-days
  });

  it("respects the interval (every 2 weeks)", async () => {
    await createEvent(UID, ev({ title: "Biweekly", date: TODAY, repeat: { freq: "weekly", interval: 2 } }));
    expect(await eventsForDay(UID, shiftDayKey(TODAY, 7))).toHaveLength(0);
    expect(await eventsForDay(UID, shiftDayKey(TODAY, 14))).toHaveLength(1);
  });

  it("a past recurring event still surfaces its next upcoming occurrence", async () => {
    await createEvent(UID, ev({ title: "Weekly", date: shiftDayKey(TODAY, -10), repeat: { freq: "weekly", interval: 1 } }));
    const up = await upcomingEventOccurrences(UID);
    expect(up).toHaveLength(1);
    expect(up[0].day >= TODAY).toBe(true);
  });
});

describe("events — calendar contribution", () => {
  it("maps a one-off event to a calendar item colored by category", async () => {
    await createEvent(UID, ev({ title: "Exam", date: TODAY, time: "10:30", category: "uni" }));
    const items = await eventsCalendarItems(UID);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ day: TODAY, kind: "event", accent: "neutral", href: "/events" });
    expect(items[0].title).toBe("10:30 Exam");
    expect(typeof items[0].color).toBe("string");
  });

  it("expands a recurring event into multiple dated items", async () => {
    await createEvent(UID, ev({ title: "Standup", date: TODAY, repeat: { freq: "weekly", interval: 1 } }));
    const items = await eventsCalendarItems(UID);
    expect(items.length).toBeGreaterThan(4); // many weekly occurrences in the window
    expect(new Set(items.map((i) => i.day)).size).toBe(items.length); // one per distinct day
  });
});

describe("events — per-user isolation", () => {
  it("keeps events scoped by user_id", async () => {
    await createEvent(UID, ev({ title: "Mine" }));
    await createEvent(OTHER, ev({ title: "Theirs" }));
    expect(await listEvents(UID)).toHaveLength(1);
    expect(await listEvents(OTHER)).toHaveLength(1);
    expect((await eventsCalendarItems(OTHER))[0].title).toBe("Theirs");
  });
});
