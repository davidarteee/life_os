"use client";

import { useXpEvents } from "@/hooks/use-game";
import { fromDayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  "habit.complete": "Habit completed",
  "habit.allDailyBonus": "All habits bonus",
  "achievement.unlock": "Achievement unlocked",
  "challenge.verified": "Challenge verified",
  "shop.spend": "Shop purchase",
  "admin.adjust": "Adjustment",
};

export function XpLedger({ limit = 12 }: { limit?: number }) {
  const events = useXpEvents(limit);
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No XP activity yet.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate">{LABELS[e.reason] ?? e.reason}</p>
            <p className="text-xs text-muted-foreground">
              {fromDayKey(e.day).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </p>
          </div>
          <span className={cn("shrink-0 font-medium tabular-nums", e.amount >= 0 ? "text-health" : "text-muted-foreground")}>
            {e.amount >= 0 ? "+" : ""}{e.amount} XP
          </span>
        </li>
      ))}
    </ul>
  );
}
