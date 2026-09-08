"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus, CalendarDays, CalendarRange } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { StatTile } from "@/components/common/stat-tile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventList, EventItem } from "@/components/events/event-list";
import { EventForm } from "@/components/events/event-form";
import { EVENT_CATEGORY } from "@/components/events/category";
import { EVENT_CATEGORIES } from "@/lib/types";
import { useAllEvents, useEventsForDay, useUpcomingEvents, useEventStats } from "@/hooks/use-events";
import type { Event } from "@/lib/types";
import { useT } from "@/hooks/use-t";

export default function EventsPage() {
  const { t } = useT();
  const stats = useEventStats();
  const all = useAllEvents();
  const today = useEventsForDay();
  const upcoming = useUpcomingEvents();

  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | undefined>();

  function openNew() { setEditEvent(undefined); setFormOpen(true); }
  function openEdit(e: Event) { setEditEvent(e); setFormOpen(true); }

  // Group all events into color-coded sections by category.
  const sections = useMemo(
    () => EVENT_CATEGORIES.map((c) => ({ category: c, events: all.filter((e) => e.category === c) })).filter((s) => s.events.length > 0),
    [all],
  );

  return (
    <PageContainer wide>
      <PageHeader
        title={t("events.title")}
        description={t("events.subtitle")}
        icon={<CalendarClock className="size-5" />}
        actions={<Button onClick={openNew} className="gap-1.5"><Plus className="size-4" /> {t("events.new")}</Button>}
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile label={t("events.today")} value={stats.today} icon={CalendarDays} accentClass="text-productivity" />
        <StatTile label={t("events.upcoming")} value={stats.upcoming} icon={CalendarRange} />
        <StatTile label={t("events.all")} value={stats.total} icon={CalendarClock} />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="today">{t("events.today")}</TabsTrigger>
          <TabsTrigger value="upcoming">{t("events.upcoming")}</TabsTrigger>
          <TabsTrigger value="all">{t("events.all")}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card><CardContent className="pt-6">
            <EventList events={today} onEdit={openEdit} emptyText={t("events.emptyToday")} showDate={false} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <Card><CardContent className="pt-6">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("events.emptyUpcoming")}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {upcoming.map(({ event, day }) => (
                  <EventItem key={`${event.id}:${day}`} event={event} displayDate={day} onEdit={openEdit} />
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {sections.length === 0 ? (
            <Card><CardContent className="pt-6">
              <p className="py-6 text-center text-sm text-muted-foreground">{t("events.empty")}</p>
            </CardContent></Card>
          ) : (
            <div className="flex flex-col gap-4">
              {sections.map(({ category, events }) => {
                const meta = EVENT_CATEGORY[category];
                const Icon = meta.icon;
                return (
                  <Card key={category}><CardContent className="pt-5">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                      <Icon className="size-4" /> {t(meta.labelKey)} <span className="text-muted-foreground/60">· {events.length}</span>
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {events.map((e) => <EventItem key={e.id} event={e} onEdit={openEdit} />)}
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EventForm open={formOpen} onOpenChange={setFormOpen} event={editEvent} />
    </PageContainer>
  );
}
