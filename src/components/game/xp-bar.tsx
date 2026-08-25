"use client";

import { levelTitleKey, type LevelProgress } from "@/lib/game/xp";
import { useT } from "@/hooks/use-t";
import type { DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface XpBarProps {
  progress: LevelProgress;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

/** Level badge + animated XP progress bar toward the next level. */
export function XpBar({ progress, showTitle = true, compact = false, className }: XpBarProps) {
  const { t } = useT();
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className={cn("font-heading font-bold text-primary", compact ? "text-base" : "text-lg")}>
            {t("common.level")} {progress.level}
          </span>
          {showTitle && <span className="text-xs text-muted-foreground">{t(levelTitleKey(progress.level) as DictKey)}</span>}
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {progress.xpIntoLevel} / {progress.xpForLevel} XP
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-goals transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round(progress.ratio * 100)}%` }}
        />
      </div>
      {!compact && (
        <p className="mt-1.5 text-xs text-muted-foreground">{t("game.nextLevel", { n: progress.xpRemaining })}</p>
      )}
    </div>
  );
}
