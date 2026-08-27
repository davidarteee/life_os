"use client";

import Link from "next/link";
import { ArrowRight, Apple, Dumbbell, Flame, Clock } from "lucide-react";
import { MacroBars } from "@/components/nutrition/macro-rings";
import { useNutritionDay } from "@/hooks/use-nutrition";
import { useWeekWorkoutStats, useWorkoutsForDay } from "@/hooks/use-workouts";
import { activityIcon, ACTIVITY_META } from "@/components/workouts/meta";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

/** Today's nutrition at a glance: calories headline + macro bars. */
export function NutritionSummaryWidget() {
  const { t } = useT();
  const nd = useNutritionDay();
  const remaining = Math.max(0, Math.round(nd.energy.remaining));
  const hasData = nd.entries.length > 0;

  return (
    <Link href="/nutrition" className="flex h-full flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-heading text-2xl font-bold tabular-nums">{Math.round(nd.totals.calories)}</p>
          <p className="text-[11px] text-muted-foreground">/ {nd.config.targets.calories} {t("nutrition.kcal")}</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", nd.targetsMet ? "bg-health/15 text-health" : "bg-muted text-muted-foreground")}>
          {hasData ? t("nutrition.widget.remaining", { n: remaining }) : t("nutrition.widget.empty")}
        </span>
      </div>
      <MacroBars totals={nd.totals} targets={nd.config.targets} />
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground">
        <Apple className="size-3" /> {t("nutrition.title")} <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}

/** This-week exercise summary + today's workouts. */
export function ExerciseSummaryWidget() {
  const { t } = useT();
  const week = useWeekWorkoutStats();
  const today = useWorkoutsForDay();

  const label = (w: Workout) => (ACTIVITY_META[w.activity] ? t(ACTIVITY_META[w.activity].labelKey) : w.activity);

  return (
    <Link href="/workouts" className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Dumbbell, value: week.count, label: t("workouts.count") },
          { icon: Clock, value: `${week.minutes}`, label: t("workouts.min") },
          { icon: Flame, value: `${week.calories}`, label: t("workouts.kcal") },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border/60 bg-card/60 py-2">
            <s.icon className="mx-auto size-3.5 text-muted-foreground" />
            <p className="mt-1 font-heading text-base font-bold tabular-nums">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {today.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">{t("workouts.widget.empty")}</p>
        ) : (
          today.slice(0, 3).map((w) => {
            const Icon = activityIcon(w.activity);
            return (
              <div key={w.id} className="flex items-center gap-2 text-xs">
                <Icon className="size-3.5 text-health" />
                <span className="flex-1 truncate capitalize">{label(w)}</span>
                {w.durationMin ? <span className="tabular-nums text-muted-foreground">{w.durationMin} {t("workouts.min")}</span> : null}
              </div>
            );
          })
        )}
      </div>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground">
        <Dumbbell className="size-3" /> {t("workouts.title")} <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}
