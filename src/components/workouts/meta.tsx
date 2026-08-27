import { Footprints, Dumbbell, Bike, Waves, Mountain, PersonStanding, Activity, type LucideIcon } from "lucide-react";
import type { DictKey } from "@/lib/i18n";
import { ACTIVITY_PRESETS } from "@/lib/data/workouts";

/** Activity preset → icon + label key. Free-text activities fall back to `Activity`. */
export const ACTIVITY_META: Record<string, { icon: LucideIcon; labelKey: DictKey }> = {
  run: { icon: Footprints, labelKey: "workouts.activity.run" },
  gym: { icon: Dumbbell, labelKey: "workouts.activity.gym" },
  bike: { icon: Bike, labelKey: "workouts.activity.bike" },
  swim: { icon: Waves, labelKey: "workouts.activity.swim" },
  walk: { icon: Footprints, labelKey: "workouts.activity.walk" },
  hike: { icon: Mountain, labelKey: "workouts.activity.hike" },
  yoga: { icon: PersonStanding, labelKey: "workouts.activity.yoga" },
  other: { icon: Activity, labelKey: "workouts.activity.other" },
};

export function activityIcon(activity: string): LucideIcon {
  return ACTIVITY_META[activity]?.icon ?? Activity;
}

export { ACTIVITY_PRESETS };
