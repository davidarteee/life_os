import {
  Users, Home, Dumbbell, GraduationCap, Cake, Scissors, BookOpen, CreditCard,
  Stethoscope, User, CalendarClock, type LucideIcon,
} from "lucide-react";
import type { EventCategory } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";
import { EVENT_CATEGORY_COLOR, EVENT_CATEGORY_LABEL } from "@/lib/data/event-meta";

/** UI metadata per category: color (from the pure meta), label key, and icon. */
export const EVENT_CATEGORY: Record<EventCategory, { color: string; labelKey: DictKey; icon: LucideIcon }> = {
  amigos: { color: EVENT_CATEGORY_COLOR.amigos, labelKey: EVENT_CATEGORY_LABEL.amigos, icon: Users },
  familia: { color: EVENT_CATEGORY_COLOR.familia, labelKey: EVENT_CATEGORY_LABEL.familia, icon: Home },
  deporte: { color: EVENT_CATEGORY_COLOR.deporte, labelKey: EVENT_CATEGORY_LABEL.deporte, icon: Dumbbell },
  uni: { color: EVENT_CATEGORY_COLOR.uni, labelKey: EVENT_CATEGORY_LABEL.uni, icon: GraduationCap },
  cumples: { color: EVENT_CATEGORY_COLOR.cumples, labelKey: EVENT_CATEGORY_LABEL.cumples, icon: Cake },
  cortesito: { color: EVENT_CATEGORY_COLOR.cortesito, labelKey: EVENT_CATEGORY_LABEL.cortesito, icon: Scissors },
  clases: { color: EVENT_CATEGORY_COLOR.clases, labelKey: EVENT_CATEGORY_LABEL.clases, icon: BookOpen },
  pagos: { color: EVENT_CATEGORY_COLOR.pagos, labelKey: EVENT_CATEGORY_LABEL.pagos, icon: CreditCard },
  medico: { color: EVENT_CATEGORY_COLOR.medico, labelKey: EVENT_CATEGORY_LABEL.medico, icon: Stethoscope },
  personal: { color: EVENT_CATEGORY_COLOR.personal, labelKey: EVENT_CATEGORY_LABEL.personal, icon: User },
  otros: { color: EVENT_CATEGORY_COLOR.otros, labelKey: EVENT_CATEGORY_LABEL.otros, icon: CalendarClock },
};

/** Metadata for any category string, tolerating legacy/unknown values. */
export function catMeta(category: string) {
  return EVENT_CATEGORY[category as EventCategory] ?? EVENT_CATEGORY.otros;
}
