"use client";

import { useState } from "react";
import { Dumbbell, Plus, Clock, Route, Flame, Info, Pencil } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { StatTile } from "@/components/common/stat-tile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { activityIcon, ACTIVITY_META } from "@/components/workouts/meta";
import { useWorkouts, useWeekWorkoutStats } from "@/hooks/use-workouts";
import { fromDayKey } from "@/lib/date";
import type { Workout } from "@/lib/types";
import { useT } from "@/hooks/use-t";

export default function WorkoutsPage() {
  const { t, locale } = useT();
  const workouts = useWorkouts();
  const week = useWeekWorkoutStats();
  const [formOpen, setFormOpen] = useState(false);
  const [editWorkout, setEditWorkout] = useState<Workout | undefined>();

  function openNew() { setEditWorkout(undefined); setFormOpen(true); }
  function openEdit(w: Workout) { setEditWorkout(w); setFormOpen(true); }

  const activityLabel = (w: Workout) => (ACTIVITY_META[w.activity] ? t(ACTIVITY_META[w.activity].labelKey) : w.activity);

  return (
    <PageContainer wide>
      <PageHeader
        title={t("workouts.title")}
        description={t("workouts.subtitle")}
        icon={<Dumbbell className="size-5" />}
        actions={<Button onClick={openNew} className="gap-1.5"><Plus className="size-4" /> {t("workouts.new")}</Button>}
      />

      {/* This-week summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("workouts.count")} value={week.count} icon={Dumbbell} accentClass="text-health" hint={t("workouts.thisWeek")} />
        <StatTile label={t("workouts.totalTime")} value={`${week.minutes} ${t("workouts.min")}`} icon={Clock} />
        <StatTile label={t("workouts.totalDistance")} value={`${week.distanceKm} ${t("workouts.km")}`} icon={Route} />
        <StatTile label={t("workouts.totalCalories")} value={`${week.calories}`} icon={Flame} accentClass="text-entertainment" hint={t("workouts.kcal")} />
      </div>

      {/* No-XP note (transparent, per the non-duplication decision) */}
      <p className="mb-5 flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" /> {t("workouts.noXpNote")}
      </p>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Workout list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("workouts.recent")}</CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("workouts.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/50">
                {workouts.map((w) => {
                  const Icon = activityIcon(w.activity);
                  return (
                    <li key={w.id} className="group flex items-center gap-3 py-2.5">
                      <span className="grid size-9 place-items-center rounded-xl bg-health/12 text-health">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {activityLabel(w)}
                          {w.source !== "manual" && <Badge variant="outline" className="px-1.5 text-[10px] capitalize">{w.source}</Badge>}
                        </p>
                        <p className="text-[11px] capitalize text-muted-foreground">
                          {fromDayKey(w.day).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
                          {w.durationMin ? ` · ${w.durationMin} ${t("workouts.min")}` : ""}
                          {w.distanceKm ? ` · ${w.distanceKm} ${t("workouts.km")}` : ""}
                          {w.calories ? ` · ${w.calories} ${t("workouts.kcal")}` : ""}
                        </p>
                        {w.notes && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{w.notes}</p>}
                      </div>
                      <button onClick={() => openEdit(w)} aria-label={t("common.edit")} className="rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
                        <Pencil className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Future integrations (honest roadmap, no fake APIs) */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("workouts.integrations")}</CardTitle>
            <CardDescription>{t("workouts.integrationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {["Strava", "Suunto"].map((name) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <span>{name}</span>
                <Badge variant="outline" className="text-muted-foreground">{t("widgets.comingSoon")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <WorkoutForm open={formOpen} onOpenChange={setFormOpen} workout={editWorkout} />
    </PageContainer>
  );
}
