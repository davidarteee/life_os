import { describe, it, expect } from "vitest";
import { monthGrid, groupByDay, type CalendarItem } from "@/lib/calendar/calendar";

describe("monthGrid", () => {
  it("always returns a full 6-week (42-cell) grid", () => {
    expect(monthGrid(2026, 7)).toHaveLength(42); // August 2026
    expect(monthGrid(2026, 1)).toHaveLength(42); // February 2026
  });

  it("starts on a Monday and includes leading days of the previous month", () => {
    // 1 Aug 2026 is a Saturday → 5 leading days (Mon–Fri) from July.
    const cells = monthGrid(2026, 7, "2026-08-15");
    expect(cells[0].date.getDay()).toBe(1); // Monday
    expect(cells[0].inMonth).toBe(false);
    expect(cells.find((c) => c.key === "2026-08-01")?.inMonth).toBe(true);
  });

  it("flags today", () => {
    const cells = monthGrid(2026, 7, "2026-08-15");
    expect(cells.filter((c) => c.isToday)).toHaveLength(1);
    expect(cells.find((c) => c.isToday)?.key).toBe("2026-08-15");
  });
});

describe("groupByDay", () => {
  it("buckets calendar items by their day key", () => {
    const items: CalendarItem[] = [
      { id: "1", day: "2026-08-10", title: "A", kind: "task", accent: "productivity", href: "/tasks" },
      { id: "2", day: "2026-08-10", title: "B", kind: "task", accent: "productivity", href: "/tasks" },
      { id: "3", day: "2026-08-11", title: "C", kind: "task", accent: "productivity", href: "/tasks" },
    ];
    const map = groupByDay(items);
    expect(map.get("2026-08-10")).toHaveLength(2);
    expect(map.get("2026-08-11")).toHaveLength(1);
    expect(map.get("2026-08-12")).toBeUndefined();
  });
});
