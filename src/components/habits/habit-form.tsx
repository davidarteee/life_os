"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Habit, Domain } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { createHabit, updateHabit, deleteHabit } from "@/lib/data/habits";
import { ICON_NAMES, resolveIcon } from "@/lib/icons";
import { ACCENT, type AccentKey } from "@/lib/domain-colors";
import { WEEKDAY_KEYS } from "@/lib/date";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS: AccentKey[] = ["health", "productivity", "learning", "goals", "finance", "entertainment", "neutral"];

interface HabitFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  habit?: Habit;
}

export function HabitForm({ open, onOpenChange, habit }: HabitFormProps) {
  const { user } = useSession();
  const { t } = useT();
  const editing = !!habit;

  const [name, setName] = useState(habit?.name ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? "CircleCheck");
  const [color, setColor] = useState<AccentKey>(habit?.color ?? "health");
  const [cadence, setCadence] = useState<Habit["cadence"]>(habit?.cadence ?? "daily");
  const [customDays, setCustomDays] = useState<number[]>(habit?.customDays ?? []);
  const [target, setTarget] = useState(habit?.target ?? 1);
  const [unit, setUnit] = useState(habit?.unit ?? "");
  const [xpReward, setXpReward] = useState(habit?.xpReward ?? 10);
  const [required, setRequired] = useState(habit?.required ?? true);

  if (!user) return null;
  const uid = user.id;

  async function onSave() {
    if (!name.trim()) return;
    const payload = {
      name, icon, color: color as Domain | "neutral", cadence,
      customDays, target: Math.max(1, target), unit: unit || undefined,
      xpReward: Math.max(0, xpReward), required,
    };
    if (editing && habit) {
      await updateHabit(uid, { ...habit, ...payload });
    } else {
      await createHabit(uid, payload);
    }
    toast.success(editing ? "Habit updated" : "Habit created");
    onOpenChange(false);
  }

  async function onDelete() {
    if (!habit) return;
    await deleteHabit(uid, habit.id);
    toast.success("Habit deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("habits.edit") : t("habits.new")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="habit-name">{t("habits.name")}</Label>
            <Input id="habit-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Meditate 5 minutes" />
          </div>

          {/* Icon picker */}
          <div className="grid gap-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_NAMES.map((n) => {
                const I = resolveIcon(n);
                return (
                  <button
                    key={n}
                    onClick={() => setIcon(n)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-lg border transition-colors",
                      icon === n ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
                    )}
                    aria-label={n}
                    aria-pressed={icon === n}
                  >
                    <I className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div className="grid gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("size-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition", ACCENT[c].dot, color === c ? "ring-foreground/60" : "ring-transparent")}
                  aria-label={c}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          {/* Cadence */}
          <div className="grid gap-1.5">
            <Label>Cadence</Label>
            <Select value={cadence} onValueChange={(v) => setCadence(v as Habit["cadence"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="custom">Custom days</SelectItem>
              </SelectContent>
            </Select>
            {cadence === "custom" && (
              <div className="mt-1 flex gap-1">
                {WEEKDAY_KEYS.map((wd, i) => (
                  <button
                    key={wd}
                    onClick={() => setCustomDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-xs capitalize transition-colors",
                      customDays.includes(i) ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {wd}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="habit-target">{t("habits.target")}</Label>
              <Input id="habit-target" type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="habit-unit">Unit</Label>
              <Input id="habit-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="min, km…" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="habit-xp">{t("habits.xp")}</Label>
            <Input id="habit-xp" type="number" min={0} value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{t("habits.required")}</p>
              <p className="text-xs text-muted-foreground">Counts toward lives &amp; perfect days</p>
            </div>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
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
