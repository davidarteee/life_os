import type { Domain } from "@/lib/types";

export type AccentKey = Domain | "neutral";

/**
 * Accent → Tailwind class fragments. Written as full literals (never
 * interpolated) so Tailwind's static extractor keeps them. Uses the LifeOS
 * domain tokens defined in globals.css.
 */
export const ACCENT: Record<AccentKey, { text: string; bg: string; bgSoft: string; border: string; ring: string; dot: string }> = {
  productivity: { text: "text-productivity", bg: "bg-productivity", bgSoft: "bg-productivity/12", border: "border-productivity/30", ring: "ring-productivity/40", dot: "bg-productivity" },
  health: { text: "text-health", bg: "bg-health", bgSoft: "bg-health/12", border: "border-health/30", ring: "ring-health/40", dot: "bg-health" },
  finance: { text: "text-finance", bg: "bg-finance", bgSoft: "bg-finance/12", border: "border-finance/30", ring: "ring-finance/40", dot: "bg-finance" },
  goals: { text: "text-goals", bg: "bg-goals", bgSoft: "bg-goals/12", border: "border-goals/30", ring: "ring-goals/40", dot: "bg-goals" },
  entertainment: { text: "text-entertainment", bg: "bg-entertainment", bgSoft: "bg-entertainment/12", border: "border-entertainment/30", ring: "ring-entertainment/40", dot: "bg-entertainment" },
  learning: { text: "text-learning", bg: "bg-learning", bgSoft: "bg-learning/12", border: "border-learning/30", ring: "ring-learning/40", dot: "bg-learning" },
  neutral: { text: "text-primary", bg: "bg-primary", bgSoft: "bg-primary/12", border: "border-primary/30", ring: "ring-primary/40", dot: "bg-primary" },
};

export function accent(key: AccentKey | undefined) {
  return ACCENT[key ?? "neutral"];
}
