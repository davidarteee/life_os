"use client";

import { Heart, Shield, Wallet } from "lucide-react";
import { useGameState, useGameConfig } from "@/hooks/use-game";
import { XpBar } from "@/components/game/xp-bar";
import { LivesDisplay } from "@/components/game/lives-display";
import { levelTitleKey } from "@/lib/game/xp";
import { useT } from "@/hooks/use-t";
import type { DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Level + XP + lives summary. `hero` renders the large profile banner. */
export function GameStatusCard({ hero = false }: { hero?: boolean }) {
  const { state, progress } = useGameState();
  const config = useGameConfig();
  const { t } = useT();
  if (!state || !progress) return null;

  return (
    <div className={cn("flex flex-col gap-4", hero && "relative overflow-hidden")}>
      {hero && <div className="aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />}

      <div className="flex items-center gap-4">
        <div className={cn("grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-goals font-heading font-bold text-white shadow-lg shadow-primary/20", hero ? "size-16 text-2xl" : "size-12 text-lg")}>
          {progress.level}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("font-heading font-semibold", hero ? "text-lg" : "text-sm")}>{t(levelTitleKey(progress.level) as DictKey)}</p>
          <XpBar progress={progress} showTitle={false} compact={!hero} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/60 py-2.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Heart className="size-3 text-life" /> {t("game.lives")}</span>
          <LivesDisplay lives={state.lives} max={config.lives.maxLives} size="sm" />
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/60 py-2.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Wallet className="size-3 text-primary" /> XP</span>
          <span className="font-heading text-sm font-bold tabular-nums">{state.spendableXp}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/60 py-2.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Shield className="size-3 text-info" /> {t("game.shields")}</span>
          <span className="font-heading text-sm font-bold tabular-nums">{state.streakShields}</span>
        </div>
      </div>
    </div>
  );
}
