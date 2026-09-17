"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, CalendarDays } from "lucide-react";
import { useToday, useAllTasks, useCalendarItems } from "@/hooks/use-tasks";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskForm } from "@/components/tasks/task-form";
import { monthGrid, groupByDay } from "@/lib/calendar/calendar";
import { PRIORITY } from "@/components/tasks/priority";
import { ACCENT } from "@/lib/domain-colors";
import { WEEKDAY_KEYS } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Today's scheduled tasks + anything overdue, interactive. */
export function TodayTasksWidget() {
  const { today, overdue } = useToday();
  const { t } = useT();
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [open, setOpen] = useState(false);
  const items = [...overdue, ...today].slice(0, 6);

  return (
    <div className="flex h-full flex-col gap-2">
      {items.length === 0 ? (
        <p className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">{t("tasks.emptyToday")}</p>
      ) : (
        items.map((task) => (
          <TaskItem key={task.id} task={task} onEdit={() => { setEditTask(task); setOpen(true); }} />
        ))
      )}
      <Link href="/tasks" className="mt-auto inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground">
        {t("tasks.all")} <ArrowRight className="size-3" />
      </Link>
      <TaskForm open={open} onOpenChange={setOpen} task={editTask} />
    </div>
  );
}

/** The full pending task list (as many as fit; scrolls). Height is resizable. */
export function TaskListWidget() {
  const all = useAllTasks();
  const { t } = useT();
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [open, setOpen] = useState(false);

  // All to-do tasks: dated ones first (soonest), then undated backlog.
  const pending = useMemo(
    () => all
      .filter((tk) => tk.status === "todo")
      .sort((a, b) => (a.date ?? "~").localeCompare(b.date ?? "~") || a.order - b.order),
    [all],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {pending.length === 0 ? (
          <p className="grid h-full place-items-center text-center text-sm text-muted-foreground">{t("tasks.emptyInbox")}</p>
        ) : (
          <div className="flex flex-col gap-1.5 pr-0.5">
            {pending.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={() => { setEditTask(task); setOpen(true); }} />
            ))}
          </div>
        )}
      </div>
      <Link href="/tasks" className="mt-2 inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground">
        <Inbox className="size-3" /> {t("nav.tasks")} <ArrowRight className="size-3" />
      </Link>
      <TaskForm open={open} onOpenChange={setOpen} task={editTask} />
    </div>
  );
}

/** Compact month calendar with task dots; links to the full calendar. */
export function MiniCalendarWidget() {
  const items = useCalendarItems();
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const now = new Date();
  const byDay = useMemo(() => groupByDay(items), [items]);
  const cells = useMemo(() => monthGrid(now.getFullYear(), now.getMonth()), [now]);
  const monthLabel = now.toLocaleDateString(locale, { month: "long" });

  return (
    <Link href="/calendar" className="flex h-full flex-col">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-heading text-sm font-semibold first-letter:uppercase">{monthLabel}</p>
        <CalendarDays className="size-3.5 text-muted-foreground" />
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[8px] uppercase text-muted-foreground/60">
        {WEEKDAY_KEYS.map((w) => <span key={w}>{t(`weekday.${w}` as const).charAt(0)}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const dayItems = byDay.get(cell.key) ?? [];
          return (
            <div key={cell.key} className={cn("relative grid aspect-square place-items-center rounded text-[9px] tabular-nums", cell.inMonth ? "text-foreground" : "text-muted-foreground/40", cell.isToday && "bg-primary font-bold text-primary-foreground")}>
              {cell.date.getDate()}
              {dayItems.length > 0 && !cell.isToday && (
                <span
                  className={cn("absolute bottom-0.5 size-1 rounded-full", !dayItems[0].color && (dayItems[0].priority ? PRIORITY[dayItems[0].priority].dot : ACCENT[dayItems[0].accent].dot))}
                  style={dayItems[0].color ? { background: dayItems[0].color } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
