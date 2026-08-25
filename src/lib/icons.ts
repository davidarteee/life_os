import type { LucideIcon } from "lucide-react";
import {
  CircleCheck, CircleCheckBig, Moon, Dumbbell, StretchHorizontal, BookOpen, Snowflake,
  Salad, Brain, PenLine, Apple, Droplet, Footprints, Bike, HeartPulse, Sun, Coffee,
  Music, Camera, Code, Languages, Leaf, Flame, Trophy, Target, Zap, Bed, GlassWater,
  Wallet, Phone, Sparkles, Timer, Waves, Mountain,
} from "lucide-react";

/**
 * Curated icon set for habits (stored as name strings). Keeping an explicit
 * registry — instead of importing all of lucide dynamically — keeps the bundle
 * lean and the icon picker predictable.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  CircleCheck, CircleCheckBig, Moon, Dumbbell, StretchHorizontal, BookOpen, Snowflake,
  Salad, Brain, PenLine, Apple, Droplet, Footprints, Bike, HeartPulse, Sun, Coffee,
  Music, Camera, Code, Languages, Leaf, Flame, Trophy, Target, Zap, Bed, GlassWater,
  Wallet, Phone, Sparkles, Timer, Waves, Mountain,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export function resolveIcon(name: string | undefined): LucideIcon {
  return (name && ICON_REGISTRY[name]) || CircleCheck;
}
