"use client";

import { Heart, CalendarOff, Shield } from "lucide-react";
import type { ShopItemId } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useGameState, useGameConfig } from "@/hooks/use-game";
import { buyShopItem } from "@/lib/data/game";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import type { DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ITEMS: { id: ShopItemId; icon: typeof Heart; labelKey: DictKey; descKey: DictKey; accent: string }[] = [
  { id: "extra_life", icon: Heart, labelKey: "shop.extraLife", descKey: "shop.extraLifeDesc", accent: "text-life" },
  { id: "free_day", icon: CalendarOff, labelKey: "shop.freeDay", descKey: "shop.freeDayDesc", accent: "text-health" },
  { id: "streak_shield", icon: Shield, labelKey: "shop.streakShield", descKey: "shop.streakShieldDesc", accent: "text-info" },
];

export function ShopPanel() {
  const { user } = useSession();
  const { state } = useGameState();
  const config = useGameConfig();
  const { t } = useT();
  if (!user || !state) return null;

  async function buy(item: ShopItemId) {
    if (!user) return;
    const res = await buyShopItem(user.id, item, config);
    if (res.ok) toast.success(t("game.purchased"), { description: `-${config.shop[item]} XP` });
    else if (res.reason === "insufficient") toast.error(t("game.notEnoughXp"));
    else if (res.reason === "max_lives") toast.error(t("game.livesFull"));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("game.spendable")}</span>
        <span className="font-heading font-bold text-primary tabular-nums">{state.spendableXp} XP</span>
      </div>
      {ITEMS.map((it) => {
        const cost = config.shop[it.id];
        const disabled = state.spendableXp < cost || (it.id === "extra_life" && state.lives >= config.lives.maxLives);
        const Icon = it.icon;
        return (
          <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5">
            <div className={cn("grid size-9 place-items-center rounded-lg bg-muted", it.accent)}>
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t(it.labelKey)}</p>
              <p className="truncate text-xs text-muted-foreground">{t(it.descKey)}</p>
            </div>
            <Button size="sm" variant="outline" disabled={disabled} onClick={() => buy(it.id)} className="shrink-0 tabular-nums">
              {cost} XP
            </Button>
          </div>
        );
      })}
    </div>
  );
}
