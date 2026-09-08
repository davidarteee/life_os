import { db } from "@/lib/db/dexie";
import { activeRecords } from "@/lib/data/repository";
import { deleteTask } from "@/lib/data/tasks";
import { deleteEvent } from "@/lib/data/events";
import type { Task, Event } from "@/lib/types";

/**
 * Collapse exact-duplicate tasks and events for a user — same content, different
 * random id — which can appear when records were created independently on two
 * devices while sync was interrupted and later converged. Keeps the earliest
 * (by created_at) of each identical group and soft-deletes the rest, so the
 * removals sync as tombstones. Conservative: only groups that match on every
 * meaningful field are touched.
 */
function keepEarliest<T extends { id: string; created_at: string }>(rows: T[], keyOf: (r: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  const remove: T[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.created_at.localeCompare(b.created_at));
    remove.push(...group.slice(1)); // keep the first, drop the rest
  }
  return remove;
}

const taskKey = (t: Task) =>
  [t.title.trim().toLowerCase(), t.date ?? "", t.priority, t.status, (t.notes ?? "").trim()].join("|");

const eventKey = (e: Event) =>
  [e.title.trim().toLowerCase(), e.date, e.time ?? "", e.category, e.repeat?.freq ?? "", e.repeat?.interval ?? ""].join("|");

export async function dedupeUserData(userId: string): Promise<{ tasks: number; events: number }> {
  const tasks = activeRecords(await db().tasks.where("user_id").equals(userId).toArray());
  const events = activeRecords(await db().events.where("user_id").equals(userId).toArray());

  const dupTasks = keepEarliest(tasks, taskKey);
  const dupEvents = keepEarliest(events, eventKey);

  for (const t of dupTasks) await deleteTask(userId, t.id);
  for (const e of dupEvents) await deleteEvent(userId, e.id);

  return { tasks: dupTasks.length, events: dupEvents.length };
}
