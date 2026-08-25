"use client";

import { useState } from "react";
import { CalendarOff, Plus, X } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { useFreeDays } from "@/hooks/use-game";
import { addFreeDay, removeFreeDay } from "@/lib/data/game";
import { dayKey, fromDayKey } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

/** Schedule free days (no life penalty). Purchased free days appear here too. */
export function FreeDaysPanel() {
  const { user } = useSession();
  const freeDays = useFreeDays();
  const { t, locale } = useT();
  const [date, setDate] = useState(dayKey());
  if (!user) return null;

  const upcoming = [...freeDays].sort((a, b) => a.day.localeCompare(b.day));

  async function add() {
    if (!user) return;
    await addFreeDay(user.id, date, "scheduled");
    toast.success(t("freeDays.scheduled"));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
        <Button onClick={add} className="gap-1.5"><Plus className="size-4" /> {t("freeDays.schedule")}</Button>
      </div>
      {upcoming.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
          {t("freeDays.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {upcoming.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
              <CalendarOff className="size-4 text-health" />
              <span className="tabular-nums">
                {fromDayKey(f.day).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <Badge variant="outline" className="ml-1 text-[10px]">{t(`freeDays.kind.${f.kind}` as const)}</Badge>
              <button
                onClick={() => removeFreeDay(user.id, f.id)}
                className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label={t("freeDays.remove")}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
