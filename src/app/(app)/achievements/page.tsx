"use client";

import { Trophy, Lock, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { AchievementsGrid } from "@/components/game/achievements-grid";
import { StatTile } from "@/components/common/stat-tile";
import { useUserAchievements } from "@/hooks/use-game";
import { ACHIEVEMENTS } from "@/lib/game/achievements-def";
import { useT } from "@/hooks/use-t";

export default function AchievementsPage() {
  const { t } = useT();
  const userAch = useUserAchievements();
  const unlocked = userAch.filter((u) => u.unlocked).length;
  const total = ACHIEVEMENTS.length;
  const earnedXp = userAch
    .filter((u) => u.unlocked)
    .reduce((sum, u) => sum + (ACHIEVEMENTS.find((a) => a.id === u.achievementId)?.xpReward ?? 0), 0);

  return (
    <PageContainer wide>
      <PageHeader title={t("game.achievements")} icon={<Trophy className="size-5" />} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label={t("game.unlocked")} value={`${unlocked}/${total}`} icon={Trophy} accentClass="text-gold" />
        <StatTile label={t("game.locked")} value={total - unlocked} icon={Lock} />
        <StatTile label="XP from achievements" value={earnedXp} icon={Sparkles} accentClass="text-primary" />
      </div>
      <AchievementsGrid />
    </PageContainer>
  );
}
