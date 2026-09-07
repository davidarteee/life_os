"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listHabits, allLogs, isScheduledOn } from "@/lib/data/habits";
import { resolveIcon } from "@/lib/icons";
import { accent } from "@/lib/domain-colors";
import { startOfMonth, endOfMonth, dayKey, weekdayIndex, fromDayKey, WEEKDAY_KEYS } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Current-month completion grid: one column per habit, one row per day. */
export function HabitHistory() {
  const uid = useUserId();
  const { t } = useT();

  const data = useLiveQuery(async () => {
    if (!uid) return null;
    const habits = await listHabits(uid);
    const start = startOfMonth();
    const end = endOfMonth();
    const days: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(dayKey(new Date(d)));
    return { habits, days };
  }, [uid]);

  const logsData = useLiveQuery(async () => {
    if (!uid) return new Map<string, Set<string>>();
    const logs = await allLogs(uid);
    const completed = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!l.completed) continue;
      if (!completed.has(l.habitId)) completed.set(l.habitId, new Set());
      completed.get(l.habitId)!.add(l.day);
    }
    return completed;
  }, [uid]);

  if (!data || !logsData) return null;
  const today = dayKey();
  const doneByHabit = logsData;

  return (
    <div className="overflow-x-auto">
      <div className="w-fit">
        {/* Header row: one column per habit */}
        <div className="mb-1.5 flex gap-1">
          <div className="w-12 shrink-0" />
          {data.habits.map((habit) => {
            const Icon = resolveIcon(habit.icon);
            const a = accent(habit.color);
            return (
              <div key={habit.id} className="flex w-6 shrink-0 justify-center" title={habit.name}>
                <span className={cn("grid size-6 place-items-center rounded-md", a.bgSoft)}>
                  <Icon className={cn("size-3.5", a.text)} />
                </span>
              </div>
            );
          })}
        </div>

        {/* One row per day of the month */}
        <div className="flex flex-col gap-1">
          {data.days.map((d) => {
            const date = fromDayKey(d);
            const n = date.getDate();
            const wd = t(`weekday.${WEEKDAY_KEYS[weekdayIndex(date)]}` as const).charAt(0);
            const isToday = d === today;
            return (
              <div key={d} className="flex items-center gap-1">
                <div className={cn("flex w-12 shrink-0 items-center justify-end gap-1 pr-1.5 text-[10px] tabular-nums", isToday ? "font-bold text-primary" : "text-muted-foreground/70")}>
                  <span className="uppercase opacity-70">{wd}</span>
                  <span>{n}</span>
                </div>
                {data.habits.map((habit) => {
                  const a = accent(habit.color);
                  const isDone = (doneByHabit.get(habit.id) ?? new Set<string>()).has(d);
                  const past = d < today;
                  const scheduled = isScheduledOn(habit, weekdayIndex(date));
                  return (
                    <div key={habit.id} className="flex w-6 shrink-0 justify-center">
                      <div
                        title={`${habit.name} · ${d}`}
                        className={cn(
                          "size-5 rounded-[4px] transition-colors",
                          isDone ? a.bg : !scheduled ? "bg-transparent" : past && habit.required ? "bg-destructive/15" : "bg-muted",
                          isToday && "ring-1 ring-primary",
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("habits.history")}</p>
      </div>
    </div>
  );
}
