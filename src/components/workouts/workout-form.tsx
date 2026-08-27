"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Workout } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { createWorkout, updateWorkout, deleteWorkout } from "@/lib/data/workouts";
import { ACTIVITY_PRESETS, ACTIVITY_META } from "@/components/workouts/meta";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

interface WorkoutFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workout?: Workout;
  defaultDay?: string;
}

export function WorkoutForm({ open, onOpenChange, workout, defaultDay }: WorkoutFormProps) {
  const { user } = useSession();
  const { t } = useT();
  const editing = !!workout;

  const presetOf = (a?: string) => (a && ACTIVITY_PRESETS.includes(a as (typeof ACTIVITY_PRESETS)[number]) ? a : "other");
  const [activity, setActivity] = useState<string>(presetOf(workout?.activity));
  const [customName, setCustomName] = useState(workout && !ACTIVITY_PRESETS.includes(workout.activity as (typeof ACTIVITY_PRESETS)[number]) ? workout.activity : "");
  const [date, setDate] = useState(workout?.day ?? defaultDay ?? dayKey());
  const [duration, setDuration] = useState(String(workout?.durationMin ?? ""));
  const [distance, setDistance] = useState(String(workout?.distanceKm ?? ""));
  const [calories, setCalories] = useState(String(workout?.calories ?? ""));
  const [notes, setNotes] = useState(workout?.notes ?? "");

  if (!user) return null;
  const uid = user.id;
  const numOrUndef = (s: string) => (s.trim() === "" ? undefined : Math.max(0, Number(s) || 0));

  async function onSave() {
    const activityValue = activity === "other" && customName.trim() ? customName.trim() : activity;
    const payload = {
      day: date,
      activity: activityValue,
      durationMin: numOrUndef(duration),
      distanceKm: numOrUndef(distance),
      calories: numOrUndef(calories),
      notes: notes.trim() || undefined,
    };
    if (editing && workout) {
      await updateWorkout(uid, { ...workout, ...payload, source: workout.source });
      toast.success(t("workouts.updated"));
    } else {
      await createWorkout(uid, { ...payload, source: "manual" });
      toast.success(t("workouts.created"));
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("workouts.edit") : t("workouts.new")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>{t("workouts.activity")}</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACTIVITY_PRESETS.map((a) => {
                const Icon = ACTIVITY_META[a].icon;
                return (
                  <button
                    key={a}
                    onClick={() => setActivity(a)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] transition-colors",
                      activity === a ? "border-health bg-health/10 text-health" : "border-border/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                    {t(ACTIVITY_META[a].labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {activity === "other" && (
            <div className="grid gap-1.5">
              <Label htmlFor="w-custom">{t("workouts.activityCustom")}</Label>
              <Input id="w-custom" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="w-date">{t("workouts.date")}</Label>
              <Input id="w-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="w-dur">{t("workouts.duration")} ({t("workouts.min")})</Label>
              <Input id="w-dur" type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="w-dist">{t("workouts.distance")} ({t("workouts.km")})</Label>
              <Input id="w-dist" type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="w-cal">{t("workouts.calories")}</Label>
              <Input id="w-cal" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="w-notes">{t("workouts.notes")}</Label>
            <Textarea id="w-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={async () => { if (workout) { await deleteWorkout(uid, workout.id); toast.success(t("workouts.deleted")); onOpenChange(false); } }}
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
