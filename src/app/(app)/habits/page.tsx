"use client";

import { useState } from "react";
import { CircleCheckBig, Plus, Flame, TrendingUp, CheckCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { TodayHabits } from "@/components/habits/today-habits";
import { HabitHistory } from "@/components/habits/habit-history";
import { HabitForm } from "@/components/habits/habit-form";
import { StatTile } from "@/components/common/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHabitStats, useTodayHabits } from "@/hooks/use-habits";
import { useT } from "@/hooks/use-t";

export default function HabitsPage() {
  const { t } = useT();
  const [formOpen, setFormOpen] = useState(false);
  const stats = useHabitStats();
  const { items } = useTodayHabits();

  const doneToday = items.filter((i) => i.completed).length;
  const bestStreak = stats?.reduce((m, s) => Math.max(m, s.currentStreak), 0) ?? 0;
  const totalCompleted = stats?.reduce((sum, s) => sum + s.totalCompleted, 0) ?? 0;

  return (
    <PageContainer wide>
      <PageHeader
        title={t("habits.title")}
        description={t("habits.subtitle")}
        icon={<CircleCheckBig className="size-5" />}
        actions={
          <Button onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="size-4" /> {t("habits.new")}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("habits.activeHabits")} value={stats?.length ?? 0} icon={CircleCheckBig} />
        <StatTile label={t("common.today")} value={`${doneToday}/${items.length}`} icon={CheckCheck} accentClass="text-health" />
        <StatTile label={t("habits.bestStreak")} value={bestStreak} icon={Flame} accentClass="text-warning" hint={t("common.days")} />
        <StatTile label={t("habits.totalCompleted")} value={totalCompleted} icon={TrendingUp} accentClass="text-primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("habits.today")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayHabits manage addButton={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("habits.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            <HabitHistory />
          </CardContent>
        </Card>
      </div>

      <HabitForm open={formOpen} onOpenChange={setFormOpen} />
    </PageContainer>
  );
}
