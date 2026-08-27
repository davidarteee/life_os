"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { FoodEntry, MealSlot } from "@/lib/types";
import { sumMacros } from "@/lib/nutrition/macros";
import { MEAL_META, unitKey } from "@/components/nutrition/meta";
import { FoodPicker } from "@/components/nutrition/food-picker";
import { useNutritionActions } from "@/hooks/use-nutrition-actions";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";

export function MealBlock({ meal, day, entries }: { meal: MealSlot; day: string; entries: FoodEntry[] }) {
  const { t } = useT();
  const { remove } = useNutritionActions();
  const [pickerOpen, setPickerOpen] = useState(false);
  const subtotal = sumMacros(entries);
  const { icon: Icon, labelKey } = MEAL_META[meal];

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-health/12 text-health">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{t(labelKey)}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">{Math.round(subtotal.calories)} {t("nutrition.kcal")}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setPickerOpen(true)} className="gap-1 text-muted-foreground hover:text-foreground">
          <Plus className="size-4" /> {t("nutrition.add")}
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="py-1 text-xs text-muted-foreground">{t("nutrition.emptyMeal")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/50">
          {entries.map((e) => (
            <li key={e.id} className="group flex items-center gap-2 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{e.name}</p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {e.quantity} {t(unitKey(e.unit))} · {Math.round(e.calories)} {t("nutrition.kcal")} · P {e.protein} · C {e.carbs} · G {e.fat}
                </p>
              </div>
              <button
                onClick={() => remove(e)}
                aria-label={t("common.remove")}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FoodPicker open={pickerOpen} onOpenChange={setPickerOpen} meal={meal} day={day} />
    </div>
  );
}
