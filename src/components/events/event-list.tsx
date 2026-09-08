"use client";

import { Clock } from "lucide-react";
import type { Event } from "@/lib/types";
import { EVENT_CATEGORY } from "@/components/events/category";
import { ACCENT } from "@/lib/domain-colors";
import { fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";
import { cn } from "@/lib/utils";

/** A single event row: category-colored icon, title, when, and notes preview. */
export function EventItem({ event, onEdit, showDate = true }: { event: Event; onEdit?: (e: Event) => void; showDate?: boolean }) {
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const meta = EVENT_CATEGORY[event.category];
  const Icon = meta.icon;
  const a = ACCENT[meta.accent];
  const dateLabel = fromDayKey(event.date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <button
      onClick={() => onEdit?.(event)}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-left transition-colors hover:border-border hover:bg-muted"
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", a.bgSoft, a.text)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        <p className="flex items-center gap-1.5 text-[11px] capitalize text-muted-foreground">
          {showDate && <span>{dateLabel}</span>}
          {event.time && <span className="inline-flex items-center gap-0.5"><Clock className="size-3" /> {event.time}</span>}
          <span className={cn("rounded-full px-1.5 py-px text-[10px] lowercase", a.bgSoft, a.text)}>{t(meta.labelKey)}</span>
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
