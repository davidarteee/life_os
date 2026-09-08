import type { EventCategory } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

/**
 * Category → color + i18n label. Pure (no icons/JSX) so the data layer, the
 * calendar provider and tests can import it. Colors are explicit OKLCH values
 * (the 7-token accent system isn't enough for 11 distinct categories); the UI
 * adds icons on top in `components/events/category`. Tuned to read on both
 * light and dark grounds.
 */
export const EVENT_CATEGORY_COLOR: Record<EventCategory, string> = {
  amigos: "oklch(0.65 0.17 255)", // blue
  familia: "oklch(0.68 0.16 150)", // green
  deporte: "oklch(0.66 0.19 35)", // orange
  uni: "oklch(0.62 0.19 300)", // violet
  cumples: "oklch(0.70 0.19 350)", // pink
  cortesito: "oklch(0.72 0.13 195)", // cyan
  clases: "oklch(0.77 0.15 85)", // amber
  pagos: "oklch(0.70 0.16 130)", // lime-green
  medico: "oklch(0.68 0.14 220)", // sky
  personal: "oklch(0.62 0.18 285)", // indigo
  otros: "oklch(0.62 0.03 260)", // gray
};

export const EVENT_CATEGORY_LABEL: Record<EventCategory, DictKey> = {
  amigos: "events.cat.amigos",
  familia: "events.cat.familia",
  deporte: "events.cat.deporte",
  uni: "events.cat.uni",
  cumples: "events.cat.cumples",
  cortesito: "events.cat.cortesito",
  clases: "events.cat.clases",
  pagos: "events.cat.pagos",
  medico: "events.cat.medico",
  personal: "events.cat.personal",
  otros: "events.cat.otros",
};

/** Color for any category string, tolerating legacy/unknown values. */
export function categoryColor(cat: string): string {
  return EVENT_CATEGORY_COLOR[cat as EventCategory] ?? EVENT_CATEGORY_COLOR.otros;
}
