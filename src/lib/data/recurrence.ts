import { dayKey, fromDayKey, addDays } from "@/lib/date";
import type { Event, RepeatFreq, DayKey } from "@/lib/types";

/**
 * Pure recurrence math for events. An event with no `repeat` occurs once (on its
 * date); a repeating event occurs every `interval` units from its start. Monthly
 * and yearly occurrences clamp the day-of-month (e.g. the 31st becomes the last
 * day of a shorter month) and are computed from the START (not the previous
 * occurrence) so they never drift.
 */

const CAP = 400;
const FAR_FUTURE = "9999-12-31";
const MS_PER_DAY = 86_400_000;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** The k-th occurrence date (k = 0 is the start), with month/year clamping. */
function occurrenceDate(start: Date, freq: RepeatFreq, interval: number, k: number): Date {
  const step = interval * k;
  if (freq === "daily") return addDays(start, step);
  if (freq === "weekly") return addDays(start, step * 7);
  if (freq === "monthly") {
    const m = start.getMonth() + step;
    const year = start.getFullYear() + Math.floor(m / 12);
    const month = ((m % 12) + 12) % 12;
    return new Date(year, month, Math.min(start.getDate(), daysInMonth(year, month)));
  }
  // yearly
  const year = start.getFullYear() + step;
  return new Date(year, start.getMonth(), Math.min(start.getDate(), daysInMonth(year, start.getMonth())));
}

/** A cheap starting index so far-future ranges don't blow the iteration cap. */
function firstIndexNear(start: Date, freq: RepeatFreq, interval: number, fromKey: DayKey): number {
  const days = Math.round((fromDayKey(fromKey).getTime() - start.getTime()) / MS_PER_DAY);
  if (days <= 0) return 0;
  let k: number;
  if (freq === "daily") k = Math.floor(days / interval);
  else if (freq === "weekly") k = Math.floor(days / (7 * interval));
  else if (freq === "monthly") k = Math.floor(days / 30 / interval);
  else k = Math.floor(days / 365 / interval);
  return Math.max(0, k - 2); // back off to absorb rounding/clamping
}

/** Occurrence day-keys within [fromKey, toKey] (inclusive), soonest first. */
export function occurrencesInRange(event: Event, fromKey: DayKey, toKey: DayKey, cap = CAP): DayKey[] {
  if (!event.repeat) {
    return event.date >= fromKey && event.date <= toKey ? [event.date] : [];
  }
  const start = fromDayKey(event.date);
  const interval = Math.max(1, Math.floor(event.repeat.interval));
  const out: DayKey[] = [];
  const k0 = firstIndexNear(start, event.repeat.freq, interval, fromKey);
  for (let k = k0; k < k0 + cap; k++) {
    const occ = dayKey(occurrenceDate(start, event.repeat.freq, interval, k));
    if (occ > toKey) break;
    if (occ >= fromKey && occ >= event.date) out.push(occ);
  }
  return out;
}

/** True if the event happens on `day` (directly or via recurrence). */
export function occursOn(event: Event, day: DayKey): boolean {
  if (!event.repeat) return event.date === day;
  return occurrencesInRange(event, day, day, 8).length > 0;
}

/** The next occurrence on/after `fromKey`, or null if there is none. */
export function nextOccurrence(event: Event, fromKey: DayKey): DayKey | null {
  if (!event.repeat) return event.date >= fromKey ? event.date : null;
  return occurrencesInRange(event, fromKey, FAR_FUTURE, 64)[0] ?? null;
}
