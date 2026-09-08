import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import { EVENT_CATEGORY_ACCENT } from "@/lib/data/event-meta";
import { dayKey } from "@/lib/date";
import type { Event, EventCategory, DayKey } from "@/lib/types";

const eventOpts = (userId: string) => ({ table: db().events, syncTable: "events" as const, userId });

/** Sort by day, then by time (timed events first within a day), then title. */
function byWhen(a: Event, b: Event): number {
  return (
    a.date.localeCompare(b.date) ||
    (a.time ?? "99:99").localeCompare(b.time ?? "99:99") ||
    a.title.localeCompare(b.title)
  );
}

export async function listEvents(userId: string): Promise<Event[]> {
  return activeRecords(await db().events.where("user_id").equals(userId).toArray()).sort(byWhen);
}

export async function eventsForDay(userId: string, day: DayKey): Promise<Event[]> {
  return activeRecords(await db().events.where("[user_id+date]").equals([userId, day]).toArray()).sort(byWhen);
}

/** Today + future events, soonest first. */
export async function upcomingEvents(userId: string, from: DayKey = dayKey()): Promise<Event[]> {
  return (await listEvents(userId)).filter((e) => e.date >= from);
}

export async function eventsInRange(userId: string, fromDay: DayKey, toDay: DayKey): Promise<Event[]> {
  return (await listEvents(userId)).filter((e) => e.date >= fromDay && e.date <= toDay);
}

export interface EventInput {
  title: string;
  date: DayKey;
  time?: string;
  category?: EventCategory;
  notes?: string;
}

export async function createEvent(userId: string, input: EventInput): Promise<Event> {
  const event = makeRecord<Event>(userId, {
    title: input.title.trim(),
    date: input.date,
    time: input.time || undefined,
    category: input.category ?? "other",
    notes: input.notes?.trim() || undefined,
  });
  return upsert(eventOpts(userId), event);
}

export async function updateEvent(userId: string, event: Event): Promise<Event> {
  return upsert(eventOpts(userId), event);
}

export async function deleteEvent(userId: string, id: string): Promise<void> {
  await softDelete(eventOpts(userId), id);
}

/** Calendar provider: every event is a dated item, colored by its category. */
export async function eventsCalendarItems(userId: string) {
  const events = await listEvents(userId);
  return events.map((e) => ({
    id: e.id,
    day: e.date,
    title: e.time ? `${e.time} ${e.title}` : e.title,
    kind: "event" as const,
    accent: EVENT_CATEGORY_ACCENT[e.category],
    href: "/events",
  }));
}
