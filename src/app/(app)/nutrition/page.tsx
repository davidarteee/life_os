"use client";

import { useState } from "react";
import { Apple, ChevronLeft, ChevronRight, CalendarDays, Utensils, CheckCircle2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MacroRings } from "@/components/nutrition/macro-rings";
import { MealBlock } from "@/components/nutrition/meal-block";
import { EnergyBalanceCard } from "@/components/nutrition/energy-balance-card";
import { MyFoodsDialog } from "@/components/nutrition/my-foods-dialog";
import { useNutritionDay } from "@/hooks/use-nutrition";
import { MEAL_SLOTS } from "@/lib/types";
import { dayKey, shiftDayKey, fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

export default function NutritionPage() {
  const { t, locale } = useT();
  const [day, setDay] = useState(dayKey());
  const [foodsOpen, setFoodsOpen] = useState(false);
  const nd = useNutritionDay(day);

  const isToday = day === dayKey();
  const dateLabel = fromDayKey(day).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <PageContainer wide>
      <PageHeader
        title={t("nutrition.title")}
        description={t("nutrition.subtitle")}
        icon={<Apple className="size-5" />}
        actions={
          <Button variant="outline" onClick={() => setFoodsOpen(true)} className="gap-1.5">
            <Utensils className="size-4" /> {t("nutrition.manageFoods")}
          </Button>
        }
      />

      {/* Day navigation */}
      <div className="mb-5 flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => setDay((d) => shiftDayKey(d, -1))} aria-label={t("nutrition.prevDay")}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2 text-center">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{dateLabel}</span>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => setDay(dayKey())} className="h-7 px-2 text-xs">
              {t("nutrition.goToday")}
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => setDay((d) => shiftDayKey(d, 1))} aria-label={t("nutrition.nextDay")}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left: meals */}
        <div className="order-2 flex flex-col gap-3 lg:order-1">
          {MEAL_SLOTS.map((meal) => (
            <MealBlock key={meal} meal={meal} day={day} entries={nd.byMeal[meal]} />
          ))}
        </div>

        {/* Right: summary + energy */}
        <div className="order-1 flex flex-col gap-5 lg:order-2">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <p className="self-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("nutrition.summary")}</p>
              <MacroRings totals={nd.totals} targets={nd.config.targets} />
              <div
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-3 py-2",
                  nd.targetsMet ? "border-health/40 bg-health/10 text-health" : "border-border/60 text-muted-foreground",
                )}
              >
                <CheckCircle2 className="size-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{nd.targetsMet ? t("nutrition.targetsMet") : t("nutrition.targetsPending")}</p>
                  <p className="text-[11px] opacity-90">{nd.targetsMet ? t("nutrition.targetsMetDesc") : t("nutrition.targetsPendingDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <EnergyBalanceCard energy={nd.energy} />
        </div>
      </div>

      <MyFoodsDialog open={foodsOpen} onOpenChange={setFoodsOpen} />
    </PageContainer>
  );
}
