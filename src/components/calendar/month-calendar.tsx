"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { monthGrid, groupByDay, type CalendarItem } from "@/lib/calendar/calendar";
import { useCalendarItems, useTasksForDay } from "@/hooks/use-tasks";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { PRIORITY } from "@/components/tasks/priority";
import { ACCENT } from "@/lib/domain-colors";
import { dayKey, fromDayKey, WEEKDAY_KEYS } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

function itemDot(item: CalendarItem): string {
  return item.priority ? PRIORITY[item.priority].dot : ACCENT[item.accent].dot;
}

export function MonthCalendar() {
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const items = useCalendarItems();

  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState(dayKey());

  const byDay = useMemo(() => groupByDay(items), [items]);
  const cells = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });

  const move = (delta: number) => setCursor((c) => {
    const d = new Date(c.y, c.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); setSelected(dayKey()); };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="p-3 md:p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading text-lg font-semibold first-letter:uppercase">{monthLabel}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToday}>{t("calendar.today")}</Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => move(-1)} aria-label={t("calendar.prev")}><ChevronLeft className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => move(1)} aria-label={t("calendar.next")}><ChevronRight className="size-4" /></Button>
          </div>
        </div>

        {/* Weekday row */}
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-muted-foreground/70">
          {WEEKDAY_KEYS.map((w) => <span key={w}>{t(`weekday.${w}` as const)}</span>)}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const dayItems = byDay.get(cell.key) ?? [];
            const isSel = cell.key === selected;
            return (
              <button
                key={cell.key}
                onClick={() => setSelected(cell.key)}
                className={cn(
                  "flex min-h-14 flex-col items-stretch gap-0.5 rounded-lg border p-1 text-left transition-colors md:min-h-24",
                  cell.inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground/50",
                  isSel ? "border-primary ring-1 ring-primary/40" : "border-border/50 hover:border-border",
                )}
              >
                <span className={cn(
                  "grid size-5 place-items-center self-end rounded-full text-[11px] tabular-nums",
                  cell.isToday && "bg-primary font-bold text-primary-foreground",
                )}>
                  {cell.date.getDate()}
                </span>
                {/* Desktop chips */}
                <div className="hidden flex-col gap-0.5 md:flex">
                  {dayItems.slice(0, 3).map((it) => (
                    <div key={it.id} className="flex items-center gap-1 truncate rounded bg-muted/60 px-1 py-0.5 text-[10px]">
                      <span className={cn("size-1.5 shrink-0 rounded-full", itemDot(it))} />
                      <span className={cn("truncate", it.done && "text-muted-foreground line-through")}>{it.title}</span>
                    </div>
                  ))}
                  {dayItems.length > 3 && <span className="px-1 text-[9px] text-muted-foreground">{t("calendar.more", { n: dayItems.length - 3 })}</span>}
                </div>
                {/* Mobile dots */}
                {dayItems.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-0.5 md:hidden">
                    {dayItems.slice(0, 4).map((it) => <span key={it.id} className={cn("size-1.5 rounded-full", itemDot(it))} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <DayPanel day={selected} />
    </div>
  );
}

function DayPanel({ day }: { day: string }) {
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const tasks = useTasksForDay(day);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const label = fromDayKey(day).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-heading text-sm font-semibold first-letter:uppercase">{label}</p>
        <Button size="sm" variant="secondary" className="gap-1" onClick={() => { setEditTask(undefined); setFormOpen(true); }}>
          <Plus className="size-4" /> {t("tasks.new")}
        </Button>
      </div>
      <TaskList
        tasks={tasks}
        onEdit={(task) => { setEditTask(task); setFormOpen(true); }}
        emptyText={t("calendar.noItems")}
        showDate={false}
        reorderable={false}
      />
      <TaskForm open={formOpen} onOpenChange={setFormOpen} task={editTask} defaultDate={day} />
    </Card>
  );
}
