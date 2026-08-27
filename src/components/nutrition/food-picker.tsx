"use client";

import { useMemo, useState } from "react";
import { Search, Plus, ChevronLeft } from "lucide-react";
import type { Food, FoodEntry, MealSlot, Macros } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FoodForm } from "@/components/nutrition/food-form";
import { useFoods, useRecentFoods } from "@/hooks/use-nutrition";
import { useNutritionActions } from "@/hooks/use-nutrition-actions";
import { FOODS_CATALOG, CATALOG_PREFIX } from "@/lib/nutrition/foods-catalog";
import { macrosForQuantity } from "@/lib/nutrition/macros";
import { MEAL_META, unitKey } from "@/components/nutrition/meta";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** A unified, selectable food from any source (catalog, user food, recent entry). */
interface FoodOption {
  key: string;
  foodId?: string;
  name: string;
  brand?: string;
  per: number;
  unit: string;
  macros: Macros;
}

function fromFood(f: Food): FoodOption {
  return { key: f.id, foodId: f.id, name: f.name, brand: f.brand, per: f.per, unit: f.unit, macros: f };
}

function fromEntry(e: FoodEntry): FoodOption {
  // Re-add the exact portion: reference amount = the logged quantity.
  return { key: `recent:${e.id}`, foodId: e.foodId, name: e.name, per: e.quantity || 1, unit: e.unit, macros: e };
}

export function FoodPicker({
  open,
  onOpenChange,
  meal,
  day,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meal: MealSlot;
  day: string;
}) {
  const { t, locale } = useT();
  const foods = useFoods();
  const recent = useRecentFoods();
  const { log } = useNutritionActions();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FoodOption | null>(null);
  const [quantity, setQuantity] = useState("");
  const [foodFormOpen, setFoodFormOpen] = useState(false);

  const catalogOptions = useMemo<FoodOption[]>(
    () =>
      FOODS_CATALOG.map((f) => ({
        key: `${CATALOG_PREFIX}${f.id}`,
        foodId: `${CATALOG_PREFIX}${f.id}`,
        name: f.names[locale] ?? f.names.en,
        per: f.per,
        unit: f.unit,
        macros: f,
      })),
    [locale],
  );

  const userOptions = useMemo(() => foods.map(fromFood), [foods]);
  const recentOptions = useMemo(() => recent.map(fromEntry), [recent]);

  const match = (o: FoodOption) => !search || o.name.toLowerCase().includes(search.toLowerCase());
  const catalogFiltered = catalogOptions.filter(match);
  const userFiltered = userOptions.filter(match);

  function reset() {
    setSelected(null);
    setQuantity("");
    setSearch("");
  }

  function pick(o: FoodOption) {
    setSelected(o);
    setQuantity(String(o.per));
  }

  function close(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function confirm() {
    if (!selected) return;
    const q = Math.max(0, Number(quantity) || 0);
    if (q <= 0) return;
    const macros = macrosForQuantity(selected.macros, selected.per, q);
    await log({ day, meal, foodId: selected.foodId, name: selected.name, quantity: q, unit: selected.unit, ...macros });
    reset();
    onOpenChange(false);
  }

  const preview = selected ? macrosForQuantity(selected.macros, selected.per, Math.max(0, Number(quantity) || 0)) : null;
  const MealIcon = MEAL_META[meal].icon;

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MealIcon className="size-4 text-health" /> {t(MEAL_META[meal].labelKey)}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            /* -------- Quantity step -------- */
            <div className="flex flex-col gap-4">
              <button onClick={() => setSelected(null)} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="size-4" /> {t("common.back")}
              </button>
              <div>
                <p className="font-heading text-lg font-semibold">{selected.name}</p>
                {selected.brand && <p className="text-xs text-muted-foreground">{selected.brand}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qty">{t("nutrition.quantity")} ({t(unitKey(selected.unit))})</Label>
                <Input id="qty" type="number" inputMode="decimal" autoFocus value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirm(); } }} />
              </div>
              {preview && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t("nutrition.preview")}</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: t("nutrition.calories"), value: preview.calories, unit: t("nutrition.kcal") },
                      { label: t("nutrition.protein"), value: preview.protein, unit: "g" },
                      { label: t("nutrition.carbs"), value: preview.carbs, unit: "g" },
                      { label: t("nutrition.fat"), value: preview.fat, unit: "g" },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="font-heading text-base font-bold tabular-nums">{m.value}</p>
                        <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>{t("common.cancel")}</Button>
                <Button onClick={confirm} className="gap-1.5"><Plus className="size-4" /> {t("nutrition.add")}</Button>
              </DialogFooter>
            </div>
          ) : (
            /* -------- Browse step -------- */
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("nutrition.search")} className="pl-8" />
              </div>

              <Tabs defaultValue={recentOptions.length > 0 ? "recent" : "catalog"}>
                <TabsList className="w-full">
                  <TabsTrigger value="recent" className="flex-1">{t("nutrition.tab.recent")}</TabsTrigger>
                  <TabsTrigger value="catalog" className="flex-1">{t("nutrition.tab.catalog")}</TabsTrigger>
                  <TabsTrigger value="mine" className="flex-1">{t("nutrition.tab.myFoods")}</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="mt-3">
                  <OptionList options={recentOptions.filter(match)} onPick={pick} emptyText={t("nutrition.noResults")} unitLabel={(u) => t(unitKey(u))} />
                </TabsContent>
                <TabsContent value="catalog" className="mt-3">
                  <OptionList options={catalogFiltered} onPick={pick} emptyText={t("nutrition.noResults")} unitLabel={(u) => t(unitKey(u))} />
                </TabsContent>
                <TabsContent value="mine" className="mt-3">
                  {userOptions.length === 0 ? (
                    <div className="grid place-items-center gap-2 py-6 text-center">
                      <p className="text-sm text-muted-foreground">{t("nutrition.emptyFoods")}</p>
                      <Button size="sm" variant="outline" onClick={() => setFoodFormOpen(true)} className="gap-1.5">
                        <Plus className="size-4" /> {t("nutrition.createFood")}
                      </Button>
                    </div>
                  ) : (
                    <OptionList options={userFiltered} onPick={pick} emptyText={t("nutrition.noResults")} unitLabel={(u) => t(unitKey(u))} />
                  )}
                </TabsContent>
              </Tabs>

              <Button variant="ghost" size="sm" onClick={() => setFoodFormOpen(true)} className="gap-1.5 text-muted-foreground">
                <Plus className="size-4" /> {t("nutrition.newFood")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FoodForm open={foodFormOpen} onOpenChange={setFoodFormOpen} />
    </>
  );
}

function OptionList({
  options,
  onPick,
  emptyText,
  unitLabel,
}: {
  options: FoodOption[];
  onPick: (o: FoodOption) => void;
  emptyText: string;
  unitLabel: (u: string) => string;
}) {
  if (options.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="flex max-h-[46vh] flex-col gap-1 overflow-y-auto pr-1">
      {options.map((o) => (
        <li key={o.key}>
          <button
            onClick={() => onPick(o)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted",
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{o.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {o.macros.calories} kcal · {o.per} {unitLabel(o.unit)}{o.brand ? ` · ${o.brand}` : ""}
              </span>
            </span>
            <Plus className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}
