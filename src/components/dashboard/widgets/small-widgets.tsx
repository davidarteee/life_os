"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Flame, ArrowRight } from "lucide-react";
import { useHabitStats } from "@/hooks/use-habits";
import { useGameState, useGameConfig } from "@/hooks/use-game";
import { LivesDisplay } from "@/components/game/lives-display";
import { resolveIcon } from "@/lib/icons";
import { accent, type AccentKey } from "@/lib/domain-colors";
import { cn } from "@/lib/utils";

/** Top habits by current streak. */
export function StreaksWidget() {
  const stats = useHabitStats();
  const top = [...(stats ?? [])].filter((s) => s.currentStreak > 0).sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 5);

  if (top.length === 0) {
    return <p className="grid h-full place-items-center text-center text-sm text-muted-foreground">Complete habits to build streaks 🔥</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {top.map(({ habit, currentStreak }) => {
        const Icon = resolveIcon(habit.icon);
        const a = accent(habit.color);
        return (
          <li key={habit.id} className="flex items-center gap-2.5">
            <div className={cn("grid size-8 place-items-center rounded-lg", a.bgSoft)}>
              <Icon className={cn("size-4", a.text)} />
            </div>
            <span className="flex-1 truncate text-sm">{habit.name}</span>
            <span className="flex items-center gap-1 font-heading text-sm font-bold text-warning">
              <Flame className="size-3.5" /> {currentStreak}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Lives status with contextual guidance. */
export function LivesWidget() {
  const { state } = useGameState();
  const config = useGameConfig();
  if (!state) return null;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <LivesDisplay lives={state.lives} max={config.lives.maxLives} size="lg" />
      <div>
        <p className="font-heading text-sm font-semibold">
          {state.lives} / {config.lives.maxLives} lives
        </p>
        <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
          {state.lives === 0
            ? "Complete your comeback challenge to restore your lives."
            : `Miss ${config.lives.missThreshold}+ required habits in a day to lose one.`}
        </p>
      </div>
    </div>
  );
}

/** Compact link card for roadmap modules shown on the dashboard. */
export function ComingSoonMini({ href, label, icon: Icon, color }: { href: string; label: string; icon: LucideIcon; color: AccentKey }) {
  const a = accent(color);
  return (
    <Link href={href} className="group flex h-full flex-col justify-between gap-3">
      <div className={cn("grid size-10 place-items-center rounded-xl", a.bgSoft)}>
        <Icon className={cn("size-5", a.text)} />
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          Coming soon <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}
