"use client";

import Link from "next/link";
import { Gamepad2, ShoppingBag, CalendarOff, Trophy, History, Swords, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameStatusCard } from "@/components/game/game-status-card";
import { ShopPanel } from "@/components/game/shop-panel";
import { FreeDaysPanel } from "@/components/game/free-days-panel";
import { AchievementsGrid } from "@/components/game/achievements-grid";
import { XpLedger } from "@/components/game/xp-ledger";
import { ChallengePanel } from "@/components/game/challenge-panel";
import { TestingTools } from "@/components/game/testing-tools";
import { useChallenges } from "@/hooks/use-game";
import { useT } from "@/hooks/use-t";

export default function ProfilePage() {
  const { t } = useT();
  const { active } = useChallenges();

  return (
    <PageContainer wide>
      <PageHeader title={t("game.title")} icon={<Gamepad2 className="size-5" />} />

      {active && (
        <Card className="mb-6 border-life/30 bg-life/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="size-4 text-life" /> {t("game.challenges")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChallengePanel challenge={active} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <GameStatusCard hero />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><ShoppingBag className="size-4" /> {t("game.shop")}</CardTitle>
            </CardHeader>
            <CardContent><ShopPanel /></CardContent>
          </Card>
          <TestingTools />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><CalendarOff className="size-4" /> {t("game.freeDays")}</CardTitle>
              </CardHeader>
              <CardContent><FreeDaysPanel /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><History className="size-4" /> {t("common.xp")}</CardTitle>
              </CardHeader>
              <CardContent><XpLedger /></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Trophy className="size-4" /> {t("game.achievements")}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/achievements">{t("common.all")} <ArrowRight className="size-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <AchievementsGrid limit={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
