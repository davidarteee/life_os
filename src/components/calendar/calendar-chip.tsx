"use client";

import { calendarItemColor, type CalendarItem } from "@/lib/calendar/calendar";
import { cn } from "@/lib/utils";

/**
 * A colored calendar entry: a rounded block tinted by the item's category /
 * priority color, with a left accent bar and a readable label. Used across the
 * month and week views (desktop and mobile) so every dated thing shows as a
 * legible colored box instead of a tiny dot.
 */
export function CalendarChip({ item, className }: { item: CalendarItem; className?: string }) {
  const color = calendarItemColor(item);
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-[11px] font-medium leading-tight md:text-xs",
        className,
      )}
      style={{
        borderColor: color,
        background: `color-mix(in oklch, ${color} 15%, transparent)`,
        color,
      }}
      title={item.title}
    >
      <span className={cn("truncate", item.done && "line-through opacity-60")}>{item.title}</span>
    </div>
  );
}
