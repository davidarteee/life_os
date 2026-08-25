"use client";

import type { LucideIcon } from "lucide-react";
import {
  CircleCheckBig, Flame, Sparkles, TrendingUp, Zap, Trophy, Bird, ShieldCheck, Lock, HelpCircle,
} from "lucide-react";
import { ACHIEVEMENTS, type AchievementDefEx } from "@/lib/game/achievements-def";
import type { AchievementRarity } from "@/lib/types";
import { useUserAchievements } from "@/hooks/use-game";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  CircleCheckBig, Flame, Sparkles, TrendingUp, Zap, Trophy, Bird, ShieldCheck,
};

const RARITY: Record<AchievementRarity, { ring: string; text: string; bg: string; label: string }> = {
  common: { ring: "ring-muted-foreground/20", text: "text-muted-foreground", bg: "bg-muted", label: "Common" },
  rare: { ring: "ring-info/40", text: "text-info", bg: "bg-info/10", label: "Rare" },
  epic: { ring: "ring-goals/40", text: "text-goals", bg: "bg-goals/10", label: "Epic" },
  legendary: { ring: "ring-gold/50", text: "text-gold", bg: "bg-gold/10", label: "Legendary" },
};

interface AchievementsGridProps {
  limit?: number;
  unlockedFirst?: boolean;
}

export function AchievementsGrid({ limit, unlockedFirst = true }: AchievementsGridProps) {
  const userAch = useUserAchievements();
  const byId = new Map(userAch.map((u) => [u.achievementId, u]));

  let defs: AchievementDefEx[] = [...ACHIEVEMENTS];
  if (unlockedFirst) {
    defs.sort((a, b) => Number(byId.get(b.id)?.unlocked ?? false) - Number(byId.get(a.id)?.unlocked ?? false));
  }
  if (limit) defs = defs.slice(0, limit);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {defs.map((def) => {
        const ua = byId.get(def.id);
        const unlocked = ua?.unlocked ?? false;
        const progress = ua?.progress ?? 0;
        const goal = def.goal ?? 1;
        const rarity = RARITY[def.rarity];
        const isHidden = def.hidden && !unlocked;
        const Icon = isHidden ? HelpCircle : ICONS[def.icon] ?? Trophy;

        return (
          <div
            key={def.id}
            className={cn(
              "relative flex gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-colors",
              unlocked ? "ring-1" : "opacity-90",
              unlocked && rarity.ring,
            )}
          >
            <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", unlocked ? rarity.bg : "bg-muted")}>
              <Icon className={cn("size-5", unlocked ? rarity.text : "text-muted-foreground/50")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={cn("truncate text-sm font-semibold", !unlocked && "text-muted-foreground")}>
                  {isHidden ? "Hidden achievement" : def.title}
                </p>
                {!unlocked && !isHidden && <Lock className="size-3 shrink-0 text-muted-foreground/50" />}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {isHidden ? "Keep going to reveal this one." : def.description}
              </p>
              {!isHidden && goal > 1 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", unlocked ? "bg-primary" : "bg-primary/50")} style={{ width: `${Math.min(100, (progress / goal) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">{Math.min(progress, goal)}/{goal}</p>
                </div>
              )}
              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn("text-[10px] font-medium", rarity.text)}>{rarity.label}</span>
                <span className="text-[10px] text-muted-foreground">+{def.xpReward} XP</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
