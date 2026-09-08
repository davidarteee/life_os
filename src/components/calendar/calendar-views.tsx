"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange } from "lucide-react";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

type View = "week" | "month";

/** A Week/Month view switcher over the unified calendar. Reused on the Calendar,
 *  Tasks and Events pages so every module can see everything dated in one place. */
export function CalendarViews({ defaultView = "month" }: { defaultView?: View }) {
  const { t } = useT();
  const [view, setView] = useState<View>(defaultView);

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit gap-1 rounded-lg border border-border/60 p-0.5">
        {(["week", "month"] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={view === v ? "default" : "ghost"}
            className={cn("h-7 gap-1.5 px-3", view !== v && "text-muted-foreground")}
            onClick={() => setView(v)}
          >
            {v === "week" ? <CalendarRange className="size-3.5" /> : <CalendarDays className="size-3.5" />}
            {v === "week" ? t("calendar.week") : t("calendar.month")}
          </Button>
        ))}
      </div>
      {view === "week" ? <WeekCalendar /> : <MonthCalendar />}
    </div>
  );
}
