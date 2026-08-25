"use client";

import { Apple, LineChart } from "lucide-react";
import type { WidgetId } from "@/lib/dashboard/widgets";
import { TodayHabits } from "@/components/habits/today-habits";
import { GameStatusCard } from "@/components/game/game-status-card";
import { AchievementsGrid } from "@/components/game/achievements-grid";
import { XpBar } from "@/components/game/xp-bar";
import { useGameState } from "@/hooks/use-game";
import { QuickNoteWidget } from "@/components/dashboard/widgets/quick-note";
import { PomodoroWidget } from "@/components/dashboard/widgets/pomodoro";
import { MonthOverviewWidget } from "@/components/dashboard/widgets/month-overview";
import { StreaksWidget, LivesWidget, ComingSoonMini } from "@/components/dashboard/widgets/small-widgets";
import { useT } from "@/hooks/use-t";

function XpProgressWidget() {
  const { progress } = useGameState();
  if (!progress) return null;
  return <XpBar progress={progress} />;
}

/** Maps a widget id to its rendered content. */
export function WidgetContent({ id }: { id: WidgetId }) {
  const { t } = useT();
  switch (id) {
    case "today-habits":
      return <TodayHabits limit={6} />;
    case "gamification":
      return <GameStatusCard />;
    case "lives":
      return <LivesWidget />;
    case "xp-progress":
      return <XpProgressWidget />;
    case "streaks":
      return <StreaksWidget />;
    case "achievements-preview":
      return <AchievementsGrid limit={3} unlockedFirst />;
    case "quick-note":
      return <QuickNoteWidget />;
    case "pomodoro":
      return <PomodoroWidget />;
    case "month-overview":
      return <MonthOverviewWidget />;
    case "coming-soon-health":
      return <ComingSoonMini href="/nutrition" label={t("widget.coming-soon-health")} icon={Apple} color="health" />;
    case "coming-soon-finance":
      return <ComingSoonMini href="/investments" label={t("widget.coming-soon-finance")} icon={LineChart} color="finance" />;
    default:
      return null;
  }
}
