"use client";

import { Flame, Utensils, Info } from "lucide-react";
import type { EnergyBalance } from "@/lib/nutrition/energy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/**
 * Transparent diet ↔ exercise energy balance. In `informational` mode the
 * target never moves — we only show consumed, burned and net. In `adjustTarget`
 * mode we also show the exact formula that produced the adjusted target, so the
 * adjustment is never hidden.
 */
export function EnergyBalanceCard({ energy }: { energy: EnergyBalance }) {
  const { t } = useT();
  const adjust = energy.mode === "adjustTarget";
  const kcal = t("nutrition.kcal");

  const cells = [
    { label: t("nutrition.energy.consumed"), value: energy.consumed, icon: Utensils, cls: "text-primary" },
    { label: t("nutrition.energy.burned"), value: energy.burned, icon: Flame, cls: "text-entertainment" },
    { label: t("nutrition.energy.net"), value: energy.net, icon: null, cls: "" },
    { label: t("nutrition.energy.remaining"), value: energy.remaining, icon: null, cls: energy.remaining < 0 ? "text-destructive" : "text-health" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="size-4 text-entertainment" /> {t("nutrition.energy.title")}
          <span className="ml-auto rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {adjust ? t("nutrition.energy.mode.adjustTarget") : t("nutrition.energy.mode.informational")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cells.map((c) => (
            <div key={c.label} className="rounded-xl border border-border/60 bg-card/60 p-3 text-center">
              <p className={cn("font-heading text-xl font-bold tabular-nums", c.cls)}>{Math.round(c.value)}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {adjust ? (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p className="mb-0.5 font-medium text-foreground">
              {t("nutrition.energy.effectiveTarget")}: {energy.effectiveTarget} {kcal}
            </p>
            <p className="tabular-nums">
              {t("nutrition.energy.formula", {
                target: energy.targetCalories,
                burned: energy.burned,
                factor: energy.factor,
                effective: energy.effectiveTarget,
              })}
            </p>
          </div>
        ) : (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" /> {t("nutrition.energy.informationalNote")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
