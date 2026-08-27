"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Food } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { createFood, updateFood, deleteFood } from "@/lib/data/foods";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unitKey } from "@/components/nutrition/meta";
import { useT } from "@/hooks/use-t";

interface FoodFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  food?: Food;
}

const UNITS = ["g", "ml", "unit"] as const;

export function FoodForm({ open, onOpenChange, food }: FoodFormProps) {
  const { user } = useSession();
  const { t } = useT();
  const editing = !!food;

  const [name, setName] = useState(food?.name ?? "");
  const [brand, setBrand] = useState(food?.brand ?? "");
  const [unit, setUnit] = useState<string>(food?.unit ?? "g");
  const [per, setPer] = useState(String(food?.per ?? 100));
  const [calories, setCalories] = useState(String(food?.calories ?? ""));
  const [protein, setProtein] = useState(String(food?.protein ?? ""));
  const [carbs, setCarbs] = useState(String(food?.carbs ?? ""));
  const [fat, setFat] = useState(String(food?.fat ?? ""));

  if (!user) return null;
  const uid = user.id;
  const num = (s: string) => Math.max(0, Number(s) || 0);

  async function onSave() {
    if (!name.trim()) return;
    const payload = {
      name,
      brand: brand.trim() || undefined,
      per: Math.max(1, num(per)),
      unit,
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
    };
    if (editing && food) {
      await updateFood(uid, { ...food, ...payload });
      toast.success(t("nutrition.foodUpdated"));
    } else {
      await createFood(uid, payload);
      toast.success(t("nutrition.foodCreated"));
    }
    onOpenChange(false);
  }

  const unitLabel = t(unitKey(unit));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("nutrition.editFood") : t("nutrition.newFood")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="food-name">{t("nutrition.foodName")}</Label>
            <Input id="food-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="food-brand">{t("nutrition.brand")}</Label>
              <Input id="food-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("nutrition.unit")}</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{t(`nutrition.unit.${u}` as const)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="food-per">{t("nutrition.perAmount")} ({unitLabel})</Label>
            <Input id="food-per" type="number" inputMode="decimal" value={per} onChange={(e) => setPer(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t("nutrition.macrosPerHint", { per: num(per), unit: unitLabel })}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5">
              <Label className="text-xs">{t("nutrition.calories")}</Label>
              <Input type="number" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t("nutrition.protein")}</Label>
              <Input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t("nutrition.carbs")}</Label>
              <Input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t("nutrition.fat")}</Label>
              <Input type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={async () => { if (food) { await deleteFood(uid, food.id); toast.success(t("nutrition.foodDeleted")); onOpenChange(false); } }}
            >
              <Trash2 className="size-4" /> {t("common.delete")}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button onClick={onSave}>{t("common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
