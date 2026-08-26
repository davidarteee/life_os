// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { resetLocalDatabase } from "@/lib/db/dexie";
import {
  createTask, inboxTasks, tasksForDay, setTaskDate, toggleTask,
  overdueTasks, tasksCalendarItems, listTasks, tasksInRange, taskXp,
} from "@/lib/data/tasks";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/config";
import { dayKey, shiftDayKey } from "@/lib/date";

const UID = "33333333-3333-3333-3333-333333333333";
const TODAY = dayKey();

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("tasks — capture → inbox → schedule → complete", () => {
  it("new tasks land in the inbox (no date, to-do)", async () => {
    await createTask(UID, { title: "Buy milk" });
    const inbox = await inboxTasks(UID);
    expect(inbox).toHaveLength(1);
    expect(inbox[0].date).toBeUndefined();
    expect(inbox[0].status).toBe("todo");
    expect(inbox[0].priority).toBe("medium");
  });

  it("scheduling moves a task out of the inbox onto its day", async () => {
    const task = await createTask(UID, { title: "Call bank" });
    await setTaskDate(UID, task, TODAY);

    expect(await inboxTasks(UID)).toHaveLength(0);
    const onDay = await tasksForDay(UID, TODAY);
    expect(onDay).toHaveLength(1);
    expect(onDay[0].date).toBe(TODAY);
  });

  it("un-scheduling returns a task to the inbox", async () => {
    const task = await createTask(UID, { title: "Someday", date: TODAY });
    await setTaskDate(UID, task, undefined);
    expect(await inboxTasks(UID)).toHaveLength(1);
    expect(await tasksForDay(UID, TODAY)).toHaveLength(0);
  });

  it("toggles done ↔ to-do and stamps completedAt", async () => {
    const task = await createTask(UID, { title: "Ship it", date: TODAY });
    const done = await toggleTask(UID, task);
    expect(done.becameDone).toBe(true);
    expect(done.task.status).toBe("done");
    expect(done.task.completedAt).toBeTruthy();

    const undone = await toggleTask(UID, done.task);
    expect(undone.becameTodo).toBe(true);
    expect(undone.task.status).toBe("todo");
    expect(undone.task.completedAt).toBeUndefined();
  });

  it("detects overdue tasks (scheduled before today, still to-do)", async () => {
    await createTask(UID, { title: "Yesterday", date: shiftDayKey(TODAY, -1) });
    await createTask(UID, { title: "Today", date: TODAY });
    const over = await overdueTasks(UID, TODAY);
    expect(over).toHaveLength(1);
    expect(over[0].title).toBe("Yesterday");
  });
});

describe("tasks — calendar contribution", () => {
  it("only dated tasks appear on the calendar, mapped to items", async () => {
    await createTask(UID, { title: "No date" });
    await createTask(UID, { title: "Dated", date: TODAY, priority: "high" });
    const items = await tasksCalendarItems(UID);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ day: TODAY, kind: "task", priority: "high", href: "/tasks" });
  });

  it("tasksInRange filters by day-key window", async () => {
    await createTask(UID, { title: "In", date: TODAY });
    await createTask(UID, { title: "Out", date: shiftDayKey(TODAY, 40) });
    const inRange = await tasksInRange(UID, shiftDayKey(TODAY, -2), shiftDayKey(TODAY, 2));
    expect(inRange).toHaveLength(1);
    expect(inRange[0].title).toBe("In");
  });
});

describe("tasks — XP + isolation", () => {
  it("awards XP by priority from config", () => {
    const xp = DEFAULT_GAME_CONFIG.xp;
    expect(taskXp("low", xp)).toBe(xp.taskLow);
    expect(taskXp("medium", xp)).toBe(xp.taskMedium);
    expect(taskXp("high", xp)).toBe(xp.taskHigh);
  });

  it("keeps tasks isolated per user", async () => {
    const other = "44444444-4444-4444-4444-444444444444";
    await createTask(UID, { title: "Mine" });
    await createTask(other, { title: "Theirs" });
    expect(await listTasks(UID)).toHaveLength(1);
    expect(await listTasks(other)).toHaveLength(1);
  });
});
