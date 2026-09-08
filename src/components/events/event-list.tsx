"use client";

import { Clock, Repeat } from "lucide-react";
import type { Event, DayKey } from "@/lib/types";
import { catMeta } from "@/components/events/category";
import { fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";

/** A single event row: category-colored icon, title, when, and notes preview. */
export function EventItem({
  event,
  onEdit,
  showDate = true,
  displayDate,
}: {
  event: Event;
  onEdit?: (e: Event) => void;
  showDate?: boolean;
  /** Override the shown date (e.g. a recurrence's next occurrence). */
  displayDate?: DayKey;
}) {
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const meta = catMeta(event.category);
  const Icon = meta.icon;
  const dateLabel = fromDayKey(displayDate ?? event.date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <button
      onClick={() => onEdit?.(event)}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-left transition-colors hover:border-border hover:bg-muted"
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl"
        style={{ background: `color-mix(in oklch, ${meta.color} 16%, transparent)`, color: meta.color }}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          {event.title}
          {event.repeat && <Repeat className="size-3 shrink-0 text-muted-foreground" />}
        </p>
        <p className="flex items-center gap-1.5 text-[11px] capitalize text-muted-foreground">
          {showDate && <span>{dateLabel}</span>}
          {event.time && <span className="inline-flex items-center gap-0.5"><Clock className="size-3" /> {event.time}</span>}
          <span className="rounded-full px-1.5 py-px text-[10px] lowercase" style={{ background: `color-mix(in oklch, ${meta.color} 16%, transparent)`, color: meta.color }}>
            {t(meta.labelKey)}
          </span>
        </p>
        {event.notes && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{event.notes}</p>}
      </div>
    </button>
  );
}

export function EventList({
  events,
  onEdit,
  emptyText,
  showDate = true,
}: {
  events: Event[];
  onEdit?: (e: Event) => void;
  emptyText: string;
  showDate?: boolean;
}) {
  if (events.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {events.map((e) => <EventItem key={e.id} event={e} onEdit={onEdit} showDate={showDate} />)}
    </div>
  );
}
