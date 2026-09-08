import { describe, it, expect } from "vitest";
import { occursOn, nextOccurrence, occurrencesInRange } from "@/lib/data/recurrence";
import type { Event } from "@/lib/types";

const base: Omit<Event, "repeat"> = {
  id: "x", user_id: "u", created_at: "", updated_at: "",
  title: "E", date: "2026-01-15", category: "otros",
};
const withRepeat = (freq: "daily" | "weekly" | "monthly" | "yearly", interval = 1): Event => ({ ...base, repeat: { freq, interval } });

describe("recurrence — one-off events", () => {
  it("occurs only on its own date", () => {
    expect(occursOn(base as Event, "2026-01-15")).toBe(true);
    expect(occursOn(base as Event, "2026-01-16")).toBe(false);
  });
  it("next occurrence is its date if not past, else null", () => {
    expect(nextOccurrence(base as Event, "2026-01-01")).toBe("2026-01-15");
    expect(nextOccurrence(base as Event, "2026-02-01")).toBeNull();
  });
});

describe("recurrence — daily / weekly", () => {
  it("daily every 3 days lands on the right days", () => {
    const e = withRepeat("daily", 3);
    expect(occursOn(e, "2026-01-15")).toBe(true);
    expect(occursOn(e, "2026-01-18")).toBe(true);
    expect(occursOn(e, "2026-01-17")).toBe(false);
  });
  it("weekly every week lands 7 days apart", () => {
    const e = withRepeat("weekly", 1);
    expect(occursOn(e, "2026-01-22")).toBe(true);
    expect(occursOn(e, "2026-01-21")).toBe(false);
  });
  it("never occurs before the start", () => {
    expect(occursOn(withRepeat("daily", 1), "2026-01-14")).toBe(false);
  });
});

describe("recurrence — monthly / yearly with clamping", () => {
  it("monthly keeps the day-of-month", () => {
    const e = withRepeat("monthly", 1);
    expect(occursOn(e, "2026-02-15")).toBe(true);
    expect(occursOn(e, "2026-03-15")).toBe(true);
  });
  it("monthly clamps a 31st to the last day of shorter months", () => {
    const e: Event = { ...base, date: "2026-01-31", repeat: { freq: "monthly", interval: 1 } };
    expect(occursOn(e, "2026-02-28")).toBe(true); // Feb has no 31st → clamped
    expect(occursOn(e, "2026-03-31")).toBe(true);
  });
  it("yearly repeats on the same month/day", () => {
    const e = withRepeat("yearly", 1);
    expect(occursOn(e, "2027-01-15")).toBe(true);
    expect(occursOn(e, "2028-01-15")).toBe(true);
  });
});

describe("recurrence — range expansion", () => {
  it("lists occurrences within a window, soonest first", () => {
    const e = withRepeat("weekly", 1);
    const occ = occurrencesInRange(e, "2026-01-15", "2026-02-15");
    expect(occ).toEqual(["2026-01-15", "2026-01-22", "2026-01-29", "2026-02-05", "2026-02-12"]);
  });
  it("handles a far-future window without exploding (bounded iteration)", () => {
    const e = withRepeat("daily", 1);
    const occ = occurrencesInRange(e, "2030-01-01", "2030-01-05");
    expect(occ).toEqual(["2030-01-01", "2030-01-02", "2030-01-03", "2030-01-04", "2030-01-05"]);
  });
});
