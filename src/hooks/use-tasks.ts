"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import {
  listTasks, inboxTasks, tasksForDay, overdueTasks,
} from "@/lib/data/tasks";
import { collectCalendarItems } from "@/lib/calendar/calendar";
import { dayKey } from "@/lib/date";
import type { Task } from "@/lib/types";

/** Live inbox (undated to-do tasks). */
export function useInbox() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? inboxTasks(uid) : []), [uid]) ?? [];
}

/** Live: tasks scheduled for a given day. */
export function useTasksForDay(day: string = dayKey()) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? tasksForDay(uid, day) : []), [uid, day]) ?? [];
}

/** Live "today" view: today's scheduled tasks + anything overdue. */
export function useToday() {
  const uid = useUserId();
  const data = useLiveQuery(async () => {
    if (!uid) return { today: [] as Task[], overdue: [] as Task[] };
    const today = dayKey();
    const [scheduled, over] = await Promise.all([tasksForDay(uid, today), overdueTasks(uid, today)]);
    return { today: scheduled, overdue: over };
  }, [uid]);
  return { today: data?.today ?? [], overdue: data?.overdue ?? [] };
}

/** Live counts for dashboards and headers. */
export function useTaskStats() {
  const uid = useUserId();
  return (
    useLiveQuery(async () => {
      if (!uid) return { pending: 0, completed: 0, overdue: 0, inbox: 0 };
      const all = await listTasks(uid);
      const today = dayKey();
      return {
        pending: all.filter((t) => t.status === "todo").length,
        completed: all.filter((t) => t.status === "done").length,
        overdue: all.filter((t) => t.status === "todo" && t.date && t.date < today).length,
        inbox: all.filter((t) => t.status === "todo" && !t.date).length,
      };
    }, [uid]) ?? { pending: 0, completed: 0, overdue: 0, inbox: 0 }
  );
}

/** Live: all active tasks (for search / filter views). */
export function useAllTasks() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listTasks(uid) : []), [uid]) ?? [];
}

/** Live: aggregated calendar items across modules. */
export function useCalendarItems() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? collectCalendarItems(uid) : []), [uid]) ?? [];
}
