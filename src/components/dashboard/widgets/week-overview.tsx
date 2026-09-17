"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { groupByDay } from "@/lib/calendar/calendar";
import { useCalendarItems } from "@/hooks/use-tasks";
import { CalendarChip } from "@/components/calendar/calendar-chip";
import { dayKey, fromDayKey, shiftDayKey, weekdayIndex, WEEKDAY_KEYS } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Current-week overview: 7 days with color-coded chips; links to the calendar. */
export function WeekOverviewWidget() {
  const { t } = useT();
  const items = useCalendarItems();
  const today = dayKey();
  const start = shiftDayKey(today, -weekdayIndex(fromDayKey(today)));
  const byDay = useMemo(() => groupByDay(items), [items]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftDayKey(start, i)), [start]);

  return (
    <Link href="/calendar" className="flex h-full flex-col">
      <div className="mb-1.5 flex items-center gap-1.5">
        <CalendarRange className="size-3.5 text-muted-foreground" />
        <p className="font-heading text-sm font-semibold">{t("calendar.thisWeek")}</p>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((d, i) => {
          const date = fromDayKey(d);
          const dayItems = byDay.get(d) ?? [];
          const isToday = d === today;
          return (
            <div key={d} className={cn("flex min-h-16 flex-col gap-1 rounded-md border p-1", isToday ? "border-primary/50 bg-primary/5" : "border-border/40")}>
              <div className="flex flex-col items-center">
                <span className="text-[8px] uppercase text-muted-foreground/60">{t(`weekday.${WEEKDAY_KEYS[i]}` as const).charAt(0)}</span>
                <span className={cn("grid size-5 place-items-center rounded-full text-[10px] tabular-nums", isToday && "bg-primary font-bold text-primary-foreground")}>
                  {date.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {dayItems.slice(0, 3).map((it) => <CalendarChip key={it.id} item={it} className="px-1 py-px text-[9px] md:text-[9px]" />)}
                {dayItems.length > 3 && <span className="text-center text-[8px] leading-none text-muted-foreground">+{dayItems.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
