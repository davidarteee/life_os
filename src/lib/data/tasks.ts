import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import type { Task, TaskPriority, DayKey } from "@/lib/types";
import { dayKey } from "@/lib/date";

const taskOpts = (userId: string) => ({ table: db().tasks, syncTable: "tasks" as const, userId });

/* ------------------------------------------------------------- Queries ---- */

export async function listTasks(userId: string): Promise<Task[]> {
  return activeRecords(await db().tasks.where("user_id").equals(userId).toArray());
}

/** Backlog / inbox: active to-do tasks with no scheduled day, ordered. */
export async function inboxTasks(userId: string): Promise<Task[]> {
  return (await listTasks(userId))
    .filter((t) => t.status === "todo" && !t.date)
    .sort(byOrder);
}

/** Tasks scheduled for a specific day (both to-do and done). */
export async function tasksForDay(userId: string, day: DayKey): Promise<Task[]> {
  return activeRecords(await db().tasks.where("[user_id+date]").equals([userId, day]).toArray()).sort(byOrder);
}

/** Active tasks scheduled within an (inclusive) day-key range — used by the calendar. */
export async function tasksInRange(userId: string, fromDay: DayKey, toDay: DayKey): Promise<Task[]> {
  return (await listTasks(userId)).filter((t) => t.date && t.date >= fromDay && t.date <= toDay);
}

/** Overdue: scheduled before today and still to-do. */
export async function overdueTasks(userId: string, today: DayKey = dayKey()): Promise<Task[]> {
  return (await listTasks(userId)).filter((t) => t.status === "todo" && t.date && t.date < today).sort(byOrder);
}

const byOrder = (a: Task, b: Task) => a.order - b.order || a.created_at.localeCompare(b.created_at);

/* ----------------------------------------------------------- Mutations ---- */

export interface TaskInput {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  date?: DayKey;
  dueDate?: DayKey;
}

async function nextOrder(userId: string, date: DayKey | undefined): Promise<number> {
  const siblings = (await listTasks(userId)).filter((t) => (t.date ?? null) === (date ?? null));
  return siblings.reduce((max, t) => Math.max(max, t.order), -1) + 1;
}

export async function createTask(userId: string, input: TaskInput): Promise<Task> {
  const task = makeRecord<Task>(userId, {
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    priority: input.priority ?? "medium",
    status: "todo",
    date: input.date,
    dueDate: input.dueDate,
    order: await nextOrder(userId, input.date),
  });
  return upsert(taskOpts(userId), task);
}

export async function updateTask(userId: string, task: Task): Promise<Task> {
  return upsert(taskOpts(userId), task);
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  await softDelete(taskOpts(userId), id);
}

/**
 * Move a task to a day (or back to the inbox when day is undefined). Re-homes
 * its order to the end of the destination list so it lands predictably.
 */
export async function setTaskDate(userId: string, task: Task, day: DayKey | undefined): Promise<Task> {
  if ((task.date ?? undefined) === (day ?? undefined)) return task;
  return upsert(taskOpts(userId), { ...task, date: day, order: await nextOrder(userId, day) });
}

/** Toggle done/todo. Returns the saved task and whether it just became done. */
export async function toggleTask(
  userId: string,
  task: Task,
): Promise<{ task: Task; becameDone: boolean; becameTodo: boolean }> {
  const done = task.status !== "done";
  const saved = await upsert(taskOpts(userId), {
    ...task,
    status: done ? "done" : "todo",
    completedAt: done ? new Date().toISOString() : undefined,
  });
  return { task: saved, becameDone: done, becameTodo: !done };
}

/** Reorder tasks within a single list (inbox or a given day). */
export async function reorderTasks(userId: string, orderedIds: string[]): Promise<void> {
  const all = await listTasks(userId);
  const byId = new Map(all.map((t) => [t.id, t]));
  for (let i = 0; i < orderedIds.length; i++) {
    const t = byId.get(orderedIds[i]);
    if (t && t.order !== i) await upsert(taskOpts(userId), { ...t, order: i });
  }
}

/** XP awarded for completing a task, by priority (config-driven). */
export function taskXp(priority: TaskPriority, cfg: { taskLow: number; taskMedium: number; taskHigh: number }): number {
  return priority === "high" ? cfg.taskHigh : priority === "low" ? cfg.taskLow : cfg.taskMedium;
}

/* ----------------------------------------------- Calendar provider -------- */
/**
 * Contribution of the Tasks module to the unified LifeOS calendar. Future
 * modules (Study exams, etc.) expose a similar provider; the calendar layer
 * aggregates them. See src/lib/calendar/calendar.ts.
 */
export async function tasksCalendarItems(userId: string) {
  const tasks = (await listTasks(userId)).filter((t) => !!t.date);
  return tasks.map((t) => ({
    id: t.id,
    day: t.date as DayKey,
    title: t.title,
    kind: "task" as const,
    accent: "productivity" as const,
    done: t.status === "done",
    priority: t.priority,
    href: "/tasks",
  }));
}
