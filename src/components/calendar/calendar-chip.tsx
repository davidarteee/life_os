"use client";

import { SquareCheckBig } from "lucide-react";
import { calendarItemColor, type CalendarItem } from "@/lib/calendar/calendar";
import { resolveIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * A colored calendar entry: a rounded block tinted by the item's category color,
 * with a left accent bar and a readable label. A leading icon distinguishes the
 * two kinds — tasks show a check box, events show their category icon — so both
 * can share a color yet still be told apart at a glance.
 */
export function CalendarChip({ item, className }: { item: CalendarItem; className?: string }) {
  const color = calendarItemColor(item);
  const Icon = item.kind === "task" ? SquareCheckBig : resolveIcon(item.icon);
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
      <Icon className="size-3 shrink-0 opacity-90" />
      <span className={cn("truncate", item.done && "line-through opacity-60")}>{item.title}</span>
    </div>
  );
}
