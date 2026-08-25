/**
 * Date helpers. LifeOS keys daily records by a local "day key" (YYYY-MM-DD in
 * the user's own timezone) rather than a UTC timestamp, so that "today" always
 * matches the wall clock on the user's device — critical for habits and streaks.
 */

/** Local day key, e.g. "2026-08-25". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a day key back into a local Date at midnight. */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function shiftDayKey(key: string, days: number): string {
  return dayKey(addDays(fromDayKey(key), days));
}

/** Inclusive list of day keys between two keys (ascending). */
export function dayKeysBetween(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  let cur = fromDayKey(startKey);
  const end = fromDayKey(endKey);
  while (cur <= end) {
    out.push(dayKey(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** ISO weekday label helpers (Mon-first weeks). */
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

/** 0 = Monday ... 6 = Sunday */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function greetingKey(date: Date = new Date()): "morning" | "afternoon" | "evening" | "night" {
  const h = date.getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
