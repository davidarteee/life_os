import { GraduationCap, Stethoscope, Star, User, PartyPopper, CalendarClock, type LucideIcon } from "lucide-react";
import type { EventCategory } from "@/lib/types";
import type { AccentKey } from "@/lib/domain-colors";
import type { DictKey } from "@/lib/i18n";
import { EVENT_CATEGORY_ACCENT, EVENT_CATEGORY_LABEL } from "@/lib/data/event-meta";

/** UI metadata per category: color (from the pure meta), label key, and icon. */
export const EVENT_CATEGORY: Record<EventCategory, { accent: AccentKey; labelKey: DictKey; icon: LucideIcon }> = {
  exam: { accent: EVENT_CATEGORY_ACCENT.exam, labelKey: EVENT_CATEGORY_LABEL.exam, icon: GraduationCap },
  medical: { accent: EVENT_CATEGORY_ACCENT.medical, labelKey: EVENT_CATEGORY_LABEL.medical, icon: Stethoscope },
  important: { accent: EVENT_CATEGORY_ACCENT.important, labelKey: EVENT_CATEGORY_LABEL.important, icon: Star },
  personal: { accent: EVENT_CATEGORY_ACCENT.personal, labelKey: EVENT_CATEGORY_LABEL.personal, icon: User },
  social: { accent: EVENT_CATEGORY_ACCENT.social, labelKey: EVENT_CATEGORY_LABEL.social, icon: PartyPopper },
  other: { accent: EVENT_CATEGORY_ACCENT.other, labelKey: EVENT_CATEGORY_LABEL.other, icon: CalendarClock },
};
