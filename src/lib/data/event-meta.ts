import type { EventCategory } from "@/lib/types";
import type { AccentKey } from "@/lib/domain-colors";
import type { DictKey } from "@/lib/i18n";

/**
 * Category → accent color + i18n label. Pure (no icons/JSX) so the data layer,
 * the calendar provider and tests can import it. The UI adds icons on top in
 * `components/events/category`.
 */
export const EVENT_CATEGORY_ACCENT: Record<EventCategory, AccentKey> = {
  exam: "learning",
  medical: "health",
  important: "goals",
  personal: "productivity",
  social: "entertainment",
  other: "neutral",
};

export const EVENT_CATEGORY_LABEL: Record<EventCategory, DictKey> = {
  exam: "events.cat.exam",
  medical: "events.cat.medical",
  important: "events.cat.important",
  personal: "events.cat.personal",
  social: "events.cat.social",
  other: "events.cat.other",
};
