"use client";

import { useXpEvents } from "@/hooks/use-game";
import { fromDayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import type { DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function XpLedger({ limit = 12 }: { limit?: number }) {
  const events = useXpEvents(limit);
  const { t, locale } = useT();
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("ledger.empty")}</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate">{t(`ledger.${e.reason}` as DictKey)}</p>
            <p className="text-xs text-muted-foreground">
              {fromDayKey(e.day).toLocaleDateString(locale, { day: "numeric", month: "short" })}
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
