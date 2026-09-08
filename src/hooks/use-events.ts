"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listEvents, eventsForDay, upcomingEvents } from "@/lib/data/events";
import { dayKey } from "@/lib/date";
import type { Event } from "@/lib/types";

/** Live: all events, soonest first. */
export function useAllEvents() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listEvents(uid) : []), [uid]) ?? [];
}

/** Live: events on a given day. */
export function useEventsForDay(day: string = dayKey()) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? eventsForDay(uid, day) : []), [uid, day]) ?? [];
}

/** Live: today + future events, soonest first. */
export function useUpcomingEvents() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? upcomingEvents(uid) : []), [uid]) ?? [];
}

/** Live counts for the events page header. */
export function useEventStats() {
  const uid = useUserId();
  return (
    useLiveQuery(async () => {
      if (!uid) return { total: 0, today: 0, upcoming: 0 };
      const all = await listEvents(uid);
      const today = dayKey();
      return {
        total: all.length,
        today: all.filter((e) => e.date === today).length,
        upcoming: all.filter((e) => e.date >= today).length,
      };
    }, [uid]) ?? { total: 0, today: 0, upcoming: 0 }
  );
}

export type { Event };
