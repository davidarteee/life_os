"use client";

import { Check, Flame, Pencil } from "lucide-react";
import type { HabitToday } from "@/hooks/use-habits";
import { useToggleHabit } from "@/hooks/use-habit-actions";
import { resolveIcon } from "@/lib/icons";
import { accent } from "@/lib/domain-colors";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HabitRowProps {
  item: HabitToday;
  day?: string;
  onEdit?: () => void;
}

/** A single habit line with completion control, streak, and (optional) progress. */
export function HabitRow({ item, day, onEdit }: HabitRowProps) {
  const toggle = useToggleHabit(day);
  const { t } = useT();
  const { habit, completed, count, streak } = item;
  const Icon = resolveIcon(habit.icon);
  const a = accent(habit.color);
  const counted = habit.target > 1;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        completed ? cn(a.border, a.bgSoft) : "border-border/60 bg-card hover:border-border",
      )}
    >
      <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg", completed ? a.bg : a.bgSoft)}>
        <Icon className={cn("size-4.5", completed ? "text-white" : a.text)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate text-sm font-medium", completed && "text-foreground")}>{habit.name}</p>
          {!habit.required && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{t("habits.optional")}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 text-warning">
              <Flame className="size-3" /> {streak}
            </span>
          )}
          {counted && (
            <span className="tabular-nums">
              {count}/{habit.target} {habit.unit ?? ""}
            </span>
          )}
          <span className="text-muted-foreground/60">+{habit.xpReward} XP</span>
        </div>
      </div>

      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onEdit}
          aria-label={t("habits.edit")}
        >
          <Pencil className="size-3.5" />
        </Button>
      )}

      <button
        onClick={() => toggle(habit)}
        aria-pressed={completed}
        aria-label={`${completed ? "Undo" : "Complete"} ${habit.name}`}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90",
          completed ? cn(a.bg, "border-transparent text-white") : cn("border-border text-transparent hover:border-primary"),
        )}
      >
        <Check className={cn("size-4 transition-transform", completed ? "scale-100" : "scale-0")} />
      </button>
    </div>
  );
}
