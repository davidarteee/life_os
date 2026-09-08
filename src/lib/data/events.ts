import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import { categoryColor } from "@/lib/data/event-meta";
import { occursOn, nextOccurrence, occurrencesInRange } from "@/lib/data/recurrence";
import { dayKey, shiftDayKey } from "@/lib/date";
import type { Event, EventCategory, EventRepeat, DayKey } from "@/lib/types";

const eventOpts = (userId: string) => ({ table: db().events, syncTable: "events" as const, userId });

/** Sort by day, then by time (timed events first within a day), then title. */
function byWhen(a: Event, b: Event): number {
  return (
    a.date.localeCompare(b.date) ||
    (a.time ?? "99:99").localeCompare(b.time ?? "99:99") ||
    a.title.localeCompare(b.title)
  );
}

/** Every active event, each listed once (by its start), soonest first. */
export async function listEvents(userId: string): Promise<Event[]> {
  return activeRecords(await db().events.where("user_id").equals(userId).toArray()).sort(byWhen);
}

/** Events that occur on `day` — directly or via recurrence. */
export async function eventsForDay(userId: string, day: DayKey): Promise<Event[]> {
  return (await listEvents(userId))
    .filter((e) => occursOn(e, day))
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.title.localeCompare(b.title));
}

/** One row per event: its next occurrence on/after `from`, soonest first. */
export interface EventOccurrence {
  event: Event;
  day: DayKey;
}
export async function upcomingEventOccurrences(userId: string, from: DayKey = dayKey()): Promise<EventOccurrence[]> {
  const out: EventOccurrence[] = [];
  for (const event of await listEvents(userId)) {
    const day = nextOccurrence(event, from);
    if (day) out.push({ event, day });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || (a.event.time ?? "99:99").localeCompare(b.event.time ?? "99:99"));
}

export interface EventInput {
  title: string;
  date: DayKey;
  time?: string;
  category?: EventCategory;
  notes?: string;
  repeat?: EventRepeat;
}

export async function createEvent(userId: string, input: EventInput): Promise<Event> {
  const event = makeRecord<Event>(userId, {
    title: input.title.trim(),
    date: input.date,
    time: input.time || undefined,
    category: input.category ?? "otros",
    notes: input.notes?.trim() || undefined,
    repeat: input.repeat,
  });
  return upsert(eventOpts(userId), event);
}

export async function updateEvent(userId: string, event: Event): Promise<Event> {
  return upsert(eventOpts(userId), event);
}

export async function deleteEvent(userId: string, id: string): Promise<void> {
  await softDelete(eventOpts(userId), id);
}

/**
 * Calendar provider: expand each event (including recurrences) into dated items
 * over a bounded window around today, colored by category. The window covers
 * month navigation comfortably without unbounded expansion.
 */
export async function eventsCalendarItems(userId: string) {
  const from = shiftDayKey(dayKey(), -186); // ~6 months back
  const to = shiftDayKey(dayKey(), 550); // ~18 months ahead
  const events = await listEvents(userId);
  return events.flatMap((e) =>
    occurrencesInRange(e, from, to).map((day) => ({
      id: e.repeat ? `${e.id}:${day}` : e.id,
      day,
      title: e.time ? `${e.time} ${e.title}` : e.title,
      kind: "event" as const,
      accent: "neutral" as const,
      color: categoryColor(e.category),
      href: "/events",
    })),
  );
}
