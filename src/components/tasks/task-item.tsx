"use client";

import { useState, type ReactNode } from "react";
import { Check, CalendarDays, MoreVertical, Pencil, Inbox, Trash2, CalendarClock } from "lucide-react";
import type { Task } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useToggleTask } from "@/hooks/use-task-actions";
import { setTaskDate, deleteTask } from "@/lib/data/tasks";
import { PRIORITY } from "@/components/tasks/priority";
import { dayKey, shiftDayKey, fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface TaskItemProps {
  task: Task;
  onEdit?: () => void;
  dragHandle?: ReactNode;
  showDate?: boolean;
}

export function TaskItem({ task, onEdit, dragHandle, showDate = true }: TaskItemProps) {
  const { user } = useSession();
  const toggle = useToggleTask();
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [dateOpen, setDateOpen] = useState(false);
  const p = PRIORITY[task.priority];
  const done = task.status === "done";
  if (!user) return null;
  const uid = user.id;

  const fmt = (d: string) => fromDayKey(d).toLocaleDateString(locale, { day: "numeric", month: "short" });
  const today = dayKey();

  async function schedule(day: string | undefined) {
    await setTaskDate(uid, task, day);
    setDateOpen(false);
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-2 transition-colors hover:border-border",
        done && "opacity-60",
      )}
    >
      {dragHandle}

      <button
        onClick={() => toggle(task)}
        aria-pressed={done}
        aria-label={done ? t("tasks.todo") : t("tasks.done")}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border-2 transition-all active:scale-90",
          done ? "border-transparent bg-primary text-white" : "border-border hover:border-primary text-transparent",
        )}
      >
        <Check className={cn("size-3.5", done ? "scale-100" : "scale-0")} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", done && "line-through text-muted-foreground")}>{task.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1", p.text)}>
            <span className={cn("size-1.5 rounded-full", p.dot)} /> {t(p.labelKey)}
          </span>
          {showDate && task.date && (
            <span className={cn("inline-flex items-center gap-1", task.date < today && !done && "text-destructive")}>
              <CalendarDays className="size-3" /> {fmt(task.date)}
            </span>
          )}
          {task.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3" /> {t("tasks.dueLabel", { date: fmt(task.dueDate) })}
            </span>
          )}
        </div>
      </div>

      {/* Schedule popover */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100" aria-label={t("tasks.scheduleFor")}>
            <CalendarDays className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => schedule(today)}>{t("tasks.today")}</Button>
            <Button size="sm" variant="secondary" onClick={() => schedule(shiftDayKey(today, 1))}>+1</Button>
            {task.date && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => schedule(undefined)}>
                {t("tasks.clearDate")}
              </Button>
            )}
          </div>
          <Input type="date" defaultValue={task.date ?? ""} onChange={(e) => e.target.value && schedule(e.target.value)} />
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}><Pencil className="size-4" /> {t("common.edit")}</DropdownMenuItem>
          )}
          {task.date && (
            <DropdownMenuItem onClick={() => schedule(undefined)}><Inbox className="size-4" /> {t("tasks.moveToInbox")}</DropdownMenuItem>
          )}
          {!task.date && (
            <DropdownMenuItem onClick={() => schedule(today)}><CalendarDays className="size-4" /> {t("tasks.moveToToday")}</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => { await deleteTask(uid, task.id); toast.success(t("tasks.deleted")); }}
          >
            <Trash2 className="size-4" /> {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
