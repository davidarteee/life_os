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
import { CalendarViews } from "@/components/calendar/calendar-views";
import { useAllEvents, useEventsForDay, useUpcomingEvents, useEventStats } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-categories";
import { useUserId } from "@/components/providers/session-provider";
import { resolveCategoryId } from "@/lib/data/categories";
import { resolveIcon } from "@/lib/icons";
import type { Event } from "@/lib/types";
import { useT } from "@/hooks/use-t";

export default function EventsPage() {
  const { t } = useT();
  const uid = useUserId() ?? "";
  const stats = useEventStats();
  const all = useAllEvents();
  const today = useEventsForDay();
  const upcoming = useUpcomingEvents();
  const categories = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | undefined>();

  function openNew() { setEditEvent(undefined); setFormOpen(true); }
  function openEdit(e: Event) { setEditEvent(e); setFormOpen(true); }

  // Group all events into color-coded sections by the user's categories.
  const sections = useMemo(
    () => categories
      .map((cat) => ({ cat, events: all.filter((e) => resolveCategoryId(uid, e.categoryId, e.category) === cat.id) }))
      .filter((s) => s.events.length > 0),
    [all, categories, uid],
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
              {sections.map(({ cat, events }) => {
                const Icon = resolveIcon(cat.icon);
                return (
                  <Card key={cat.id}><CardContent className="pt-5">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: cat.color }}>
                      <Icon className="size-4" /> {cat.name} <span className="text-muted-foreground/60">· {events.length}</span>
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

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold">{t("calendar.title")}</h2>
        <CalendarViews defaultView="month" />
      </div>

      <EventForm open={formOpen} onOpenChange={setFormOpen} event={editEvent} />
    </PageContainer>
  );
}
