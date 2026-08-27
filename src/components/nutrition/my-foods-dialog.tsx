"use client";

import { useState } from "react";
import { Plus, Star, Pencil } from "lucide-react";
import type { Food } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FoodForm } from "@/components/nutrition/food-form";
import { useFoods } from "@/hooks/use-nutrition";
import { unitKey } from "@/components/nutrition/meta";
import { useSession } from "@/components/providers/session-provider";
import { toggleFavorite } from "@/lib/data/foods";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

export function MyFoodsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useT();
  const { user } = useSession();
  const foods = useFoods();
  const [formOpen, setFormOpen] = useState(false);
  const [editFood, setEditFood] = useState<Food | undefined>();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("nutrition.manageFoods")}</DialogTitle>
          </DialogHeader>

          {foods.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("nutrition.emptyFoods")}</p>
          ) : (
            <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto pr-1">
              {foods.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <button
                    onClick={() => user && toggleFavorite(user.id, f)}
                    aria-label={t("nutrition.favorite")}
                    className={cn("rounded p-0.5", f.favorite ? "text-learning" : "text-muted-foreground/50 hover:text-muted-foreground")}
                  >
                    <Star className={cn("size-4", f.favorite && "fill-current")} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground">{f.calories} kcal · {f.per} {t(unitKey(f.unit))}</p>
                  </div>
                  <button onClick={() => { setEditFood(f); setFormOpen(true); }} aria-label={t("common.edit")} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button variant="outline" size="sm" onClick={() => { setEditFood(undefined); setFormOpen(true); }} className="gap-1.5">
            <Plus className="size-4" /> {t("nutrition.newFood")}
          </Button>
        </DialogContent>
      </Dialog>

      <FoodForm open={formOpen} onOpenChange={setFormOpen} food={editFood} />
    </>
  );
}
