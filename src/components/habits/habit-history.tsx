"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listHabits, allLogs, isScheduledOn } from "@/lib/data/habits";
import { resolveIcon } from "@/lib/icons";
import { accent } from "@/lib/domain-colors";
import { startOfMonth, endOfMonth, dayKey, weekdayIndex, fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Current-month completion grid: one row per habit, one cell per day. */
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

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="mb-2 flex gap-1 pl-[168px]">
          {data.days.map((d) => {
            const n = fromDayKey(d).getDate();
            return (
              <div key={d} className={cn("w-5 text-center text-[9px]", d === today ? "font-bold text-primary" : "text-muted-foreground/60")}>
                {n % 5 === 1 || n === 1 ? n : ""}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          {data.habits.map((habit) => {
            const Icon = resolveIcon(habit.icon);
            const a = accent(habit.color);
            const done = logsData.get(habit.id) ?? new Set<string>();
            return (
              <div key={habit.id} className="flex items-center gap-1">
                <div className="flex w-[160px] shrink-0 items-center gap-2 pr-2">
                  <Icon className={cn("size-3.5", a.text)} />
                  <span className="truncate text-xs">{habit.name}</span>
                </div>
                {data.days.map((d) => {
                  const isDone = done.has(d);
                  const past = d < today;
                  const scheduled = isScheduledOn(habit, weekdayIndex(fromDayKey(d)));
                  return (
                    <div
                      key={d}
                      title={d}
                      className={cn(
                        "size-5 rounded-[4px] transition-colors",
                        isDone ? a.bg : !scheduled ? "bg-transparent" : past && habit.required ? "bg-destructive/15" : "bg-muted",
                        d === today && "ring-1 ring-primary",
                      )}
                    />
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
