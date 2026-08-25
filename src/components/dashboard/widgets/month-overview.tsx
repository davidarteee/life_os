"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { allLogs } from "@/lib/data/habits";
import { startOfMonth, endOfMonth, dayKey, weekdayIndex } from "@/lib/date";
import { WEEKDAY_KEYS } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Mini month calendar; day intensity reflects habit completions that day. */
export function MonthOverviewWidget() {
  const uid = useUserId();
  const { t, locale } = useT();

  const counts = useLiveQuery(async () => {
    if (!uid) return new Map<string, number>();
    const logs = await allLogs(uid);
    const map = new Map<string, number>();
    for (const l of logs) if (l.completed) map.set(l.day, (map.get(l.day) ?? 0) + 1);
    return map;
  }, [uid]) ?? new Map<string, number>();

  const start = startOfMonth();
  const end = endOfMonth();
  const today = dayKey();
  const lead = weekdayIndex(start); // blanks before day 1
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) cells.push(dayKey(new Date(d)));

  const max = Math.max(1, ...Array.from(counts.values()));

  return (
    <div>
      <p className="mb-2 font-heading text-sm font-semibold first-letter:uppercase">
        {start.toLocaleDateString(locale, { month: "long", year: "numeric" })}
      </p>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] uppercase text-muted-foreground/60">
        {WEEKDAY_KEYS.map((w) => <span key={w}>{t(`weekday.${w}` as const).charAt(0)}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <span key={i} />;
          const n = counts.get(c) ?? 0;
          const intensity = n / max;
          const isToday = c === today;
          return (
            <div
              key={c}
              title={`${c}: ${n} completed`}
              className={cn(
                "grid aspect-square place-items-center rounded-md text-[10px] tabular-nums transition-colors",
                isToday && "ring-1 ring-primary",
                n === 0 ? "bg-muted/60 text-muted-foreground/70" : "text-white",
              )}
              style={n > 0 ? { backgroundColor: `color-mix(in oklch, var(--primary) ${20 + intensity * 70}%, transparent)` } : undefined}
            >
              {Number(c.slice(-2))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
