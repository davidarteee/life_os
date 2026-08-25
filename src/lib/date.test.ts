import { describe, it, expect } from "vitest";
import { dayKey, fromDayKey, shiftDayKey, dayKeysBetween, greetingKey, weekdayIndex } from "@/lib/date";

describe("day keys", () => {
  it("formats a local day key as YYYY-MM-DD", () => {
    expect(dayKey(new Date(2026, 7, 5))).toBe("2026-08-05");
  });

  it("round-trips through fromDayKey", () => {
    const d = fromDayKey("2026-08-25");
    expect(dayKey(d)).toBe("2026-08-25");
  });

  it("shifts across month boundaries", () => {
    expect(shiftDayKey("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftDayKey("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("lists inclusive ranges", () => {
    expect(dayKeysBetween("2026-08-24", "2026-08-26")).toEqual(["2026-08-24", "2026-08-25", "2026-08-26"]);
  });

  it("maps Monday to weekday index 0", () => {
    expect(weekdayIndex(new Date(2026, 7, 24))).toBe(0); // 2026-08-24 is a Monday
    expect(weekdayIndex(new Date(2026, 7, 30))).toBe(6); // Sunday
  });

  it("buckets greetings by hour", () => {
    expect(greetingKey(new Date(2026, 0, 1, 8))).toBe("morning");
    expect(greetingKey(new Date(2026, 0, 1, 14))).toBe("afternoon");
    expect(greetingKey(new Date(2026, 0, 1, 20))).toBe("evening");
    expect(greetingKey(new Date(2026, 0, 1, 3))).toBe("night");
  });
});
