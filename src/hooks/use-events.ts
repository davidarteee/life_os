"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listEvents, eventsForDay, upcomingEventOccurrences, type EventOccurrence } from "@/lib/data/events";
import { dayKey } from "@/lib/date";
import type { Event } from "@/lib/types";

/** Live: all events, each once (by start), soonest first. */
export function useAllEvents() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listEvents(uid) : []), [uid]) ?? [];
}

/** Live: events occurring on a given day (incl. recurrences). */
export function useEventsForDay(day: string = dayKey()) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? eventsForDay(uid, day) : []), [uid, day]) ?? [];
}

/** Live: next occurrence per event, on/after today, soonest first. */
export function useUpcomingEvents(): EventOccurrence[] {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? upcomingEventOccurrences(uid) : []), [uid]) ?? [];
}

/** Live counts for the events page header. */
export function useEventStats() {
  const uid = useUserId();
  return (
    useLiveQuery(async () => {
      if (!uid) return { total: 0, today: 0, upcoming: 0 };
      const today = dayKey();
      const [all, onToday, upcoming] = await Promise.all([
        listEvents(uid),
        eventsForDay(uid, today),
        upcomingEventOccurrences(uid, today),
      ]);
      return { total: all.length, today: onToday.length, upcoming: upcoming.length };
    }, [uid]) ?? { total: 0, today: 0, upcoming: 0 }
  );
}

export type { Event };
