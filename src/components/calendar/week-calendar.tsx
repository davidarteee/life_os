"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { groupByDay } from "@/lib/calendar/calendar";
import { useCalendarItems } from "@/hooks/use-tasks";
import { CalendarChip } from "@/components/calendar/calendar-chip";
import { dayKey, fromDayKey, shiftDayKey, weekdayIndex, WEEKDAY_KEYS } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Monday of the week containing `key`. */
function weekStartKey(key: string): string {
  return shiftDayKey(key, -weekdayIndex(fromDayKey(key)));
}

/** A week agenda (Mon–Sun): each day lists its tasks + events, navigable. */
export function WeekCalendar() {
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const items = useCalendarItems();
  const [start, setStart] = useState(() => weekStartKey(dayKey()));

  const byDay = useMemo(() => groupByDay(items), [items]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftDayKey(start, i)), [start]);
  const today = dayKey();

  const rangeLabel = `${fromDayKey(start).toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${fromDayKey(days[6]).toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

  return (
    <Card className="p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-lg font-semibold first-letter:uppercase">{rangeLabel}</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setStart(weekStartKey(today))}>{t("calendar.thisWeek")}</Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setStart((s) => shiftDayKey(s, -7))} aria-label={t("calendar.prevWeek")}><ChevronLeft className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setStart((s) => shiftDayKey(s, 7))} aria-label={t("calendar.nextWeek")}><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {days.map((d, i) => {
          const date = fromDayKey(d);
          const dayItems = byDay.get(d) ?? [];
          const isToday = d === today;
          return (
            <div key={d} className={cn("flex min-h-24 flex-col rounded-lg border p-1.5", isToday ? "border-primary/50 bg-primary/5" : "border-border/50")}>
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span className="text-[10px] font-medium uppercase text-muted-foreground/70">{t(`weekday.${WEEKDAY_KEYS[i]}` as const)}</span>
                <span className={cn("grid size-5 place-items-center rounded-full text-[11px] tabular-nums", isToday && "bg-primary font-bold text-primary-foreground")}>
                  {date.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {dayItems.length === 0 ? (
                  <span className="px-1 py-2 text-center text-[10px] text-muted-foreground/40 sm:py-3">—</span>
                ) : (
                  dayItems.map((it) => (
                    <Link key={it.id} href={it.href} className="block transition-opacity hover:opacity-80">
                      <CalendarChip item={it} />
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
