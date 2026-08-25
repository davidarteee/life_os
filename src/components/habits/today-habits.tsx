"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTodayHabits } from "@/hooks/use-habits";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitForm } from "@/components/habits/habit-form";
import { ProgressRing } from "@/components/habits/progress-ring";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/hooks/use-t";
import type { Habit } from "@/lib/types";

interface TodayHabitsProps {
  manage?: boolean;
  addButton?: boolean;
  limit?: number;
}

/** Today's scheduled habits with a completion ring. Reused on dashboard + page. */
export function TodayHabits({ manage = false, addButton = true, limit }: TodayHabitsProps) {
  const { items, loading } = useTodayHabits();
  const { t } = useT();
  const [formOpen, setFormOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>();

  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const ratio = total ? done / total : 0;
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3">
        <ProgressRing value={ratio} size={52} stroke={5}>
          <span className="text-xs font-semibold tabular-nums">{done}/{total}</span>
        </ProgressRing>
        <div className="flex-1">
          <p className="font-heading text-sm font-semibold">{t("habits.today")}</p>
          <p className="text-xs text-muted-foreground">
            {total === 0 ? t("habits.empty") : done === total ? t("habits.allDone") : `${total - done} left`}
          </p>
        </div>
        {manage && addButton && (
          <Button size="sm" onClick={() => { setEditHabit(undefined); setFormOpen(true); }} className="gap-1">
            <Plus className="size-4" /> {t("common.add")}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            {t("habits.empty")}
          </div>
        ) : (
          shown.map((item) => (
            <HabitRow
              key={item.habit.id}
              item={item}
              onEdit={manage ? () => { setEditHabit(item.habit); setFormOpen(true); } : undefined}
            />
          ))
        )}
        {limit && items.length > limit && (
          <p className="pt-1 text-center text-xs text-muted-foreground">+{items.length - limit} more</p>
        )}
      </div>

      {manage && <HabitForm open={formOpen} onOpenChange={setFormOpen} habit={editHabit} />}
    </div>
  );
}
