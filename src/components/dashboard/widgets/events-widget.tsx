"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { useEventsForDay } from "@/hooks/use-events";
import { EventItem } from "@/components/events/event-list";
import { EventForm } from "@/components/events/event-form";
import type { Event } from "@/lib/types";
import { useT } from "@/hooks/use-t";

/** Today's events, interactive — mirrors the Today's-tasks widget. */
export function TodayEventsWidget() {
  const today = useEventsForDay();
  const { t } = useT();
  const [editEvent, setEditEvent] = useState<Event | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full flex-col gap-2">
      {today.length === 0 ? (
        <p className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">{t("events.emptyToday")}</p>
      ) : (
        today.map((e) => (
          <EventItem key={e.id} event={e} onEdit={() => { setEditEvent(e); setOpen(true); }} showDate={false} />
        ))
      )}
      <Link href="/events" className="mt-auto inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground">
        <CalendarClock className="size-3" /> {t("events.title")} <ArrowRight className="size-3" />
      </Link>
      <EventForm open={open} onOpenChange={setOpen} event={editEvent} />
    </div>
  );
}
