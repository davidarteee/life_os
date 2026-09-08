"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTodayHabits, type HabitToday } from "@/hooks/use-habits";
import { useSession } from "@/components/providers/session-provider";
import { listHabits, reorderHabits } from "@/lib/data/habits";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitForm } from "@/components/habits/habit-form";
import { ProgressRing } from "@/components/habits/progress-ring";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dayKey, shiftDayKey, fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TodayHabitsProps {
  manage?: boolean;
  addButton?: boolean;
  limit?: number;
  /** Show prev/next day arrows to browse other days' habits. */
  navigable?: boolean;
}

/** One draggable habit row (reorder handle on the left) for manage mode. */
function SortableHabit({ item, day, onEdit }: { item: HabitToday; day: string; onEdit?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.habit.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1", isDragging && "z-10 opacity-80")}
    >
      <button
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <HabitRow item={item} day={day} onEdit={onEdit} />
      </div>
    </div>
  );
}

/** Today's scheduled habits with a completion ring. Reused on dashboard + page. */
export function TodayHabits({ manage = false, addButton = true, limit, navigable = false }: TodayHabitsProps) {
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const { user } = useSession();
  const [day, setDay] = useState(dayKey());
  const activeDay = navigable ? day : dayKey();
  const { items, loading } = useTodayHabits(activeDay);
  const [formOpen, setFormOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>();

  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const ratio = total ? done / total : 0;
  const shown = limit ? items.slice(0, limit) : items;

  const isToday = activeDay === dayKey();
  const dateLabel = fromDayKey(activeDay).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Reorder within the FULL habit list (the shown set may be a scheduled subset).
  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id || !user) return;
    const ids = (await listHabits(user.id)).map((h) => h.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    await reorderHabits(user.id, arrayMove(ids, from, to));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3">
        <ProgressRing value={ratio} size={52} stroke={5}>
          <span className="text-xs font-semibold tabular-nums">{done}/{total}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold first-letter:uppercase">
            {navigable && !isToday ? dateLabel : t("habits.today")}
          </p>
          <p className="text-xs text-muted-foreground">
            {total === 0 ? t("habits.empty") : done === total ? t("habits.allDone") : t("habits.left", { n: total - done })}
          </p>
        </div>

        {navigable && (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setDay((d) => shiftDayKey(d, -1))} aria-label={t("habits.prevDay")}>
              <ChevronLeft className="size-4" />
            </Button>
            {!isToday && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDay(dayKey())}>{t("common.today")}</Button>
            )}
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setDay((d) => shiftDayKey(d, 1))} aria-label={t("habits.nextDay")}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

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
        ) : manage ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={shown.map((i) => i.habit.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {shown.map((item) => (
                  <SortableHabit
                    key={item.habit.id}
                    item={item}
                    day={activeDay}
                    onEdit={() => { setEditHabit(item.habit); setFormOpen(true); }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          shown.map((item) => (
            <HabitRow
              key={item.habit.id}
              item={item}
              day={activeDay}
              onEdit={manage ? () => { setEditHabit(item.habit); setFormOpen(true); } : undefined}
            />
          ))
        )}
        {limit && items.length > limit && (
          <p className="pt-1 text-center text-xs text-muted-foreground">+{t("common.more", { n: items.length - limit })}</p>
        )}
      </div>

      {manage && <HabitForm open={formOpen} onOpenChange={setFormOpen} habit={editHabit} />}
    </div>
  );
}
