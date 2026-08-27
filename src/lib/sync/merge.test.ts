import { describe, it, expect } from "vitest";
import {
  shouldApplyRemote, pullWindowStart, healHighWater, boundHighWater, PULL_OVERLAP_MS,
} from "@/lib/sync/sync-engine";

describe("shouldApplyRemote — last-write-wins conflict resolution", () => {
  it("applies a remote record that has no local copy", () => {
    expect(shouldApplyRemote(undefined, { updated_at: "2026-01-01T00:00:00.000Z" })).toBe(true);
    expect(shouldApplyRemote(null, { updated_at: "2026-01-01T00:00:00.000Z" })).toBe(true);
  });

  it("applies a strictly newer remote record", () => {
    expect(
      shouldApplyRemote({ updated_at: "2026-01-01T00:00:00.000Z" }, { updated_at: "2026-01-02T00:00:00.000Z" }),
    ).toBe(true);
  });

  it("does NOT apply an older remote record (keeps the local edit)", () => {
    expect(
      shouldApplyRemote({ updated_at: "2026-01-02T00:00:00.000Z" }, { updated_at: "2026-01-01T00:00:00.000Z" }),
    ).toBe(false);
  });

  it("is idempotent: re-pulling an identical timestamp does not rewrite", () => {
    const ts = "2026-01-01T00:00:00.000Z";
    expect(shouldApplyRemote({ updated_at: ts }, { updated_at: ts })).toBe(false);
  });

  it("never resurrects a locally-newer delete over a stale remote copy", () => {
    // Local tombstone (deleted) is newer than the remote non-deleted copy.
    const localTombstone = { updated_at: "2026-01-03T00:00:00.000Z" };
    const staleRemote = { updated_at: "2026-01-01T00:00:00.000Z" };
    expect(shouldApplyRemote(localTombstone, staleRemote)).toBe(false);
  });
});

describe("pull window — robust high-water-mark (regression: cross-device miss)", () => {
  it("re-scans a small overlap below the stored mark so peer inserts are not skipped", () => {
    const mark = "2026-06-01T12:00:00.000Z";
    const start = pullWindowStart(mark);
    expect(Date.parse(mark) - Date.parse(start)).toBe(PULL_OVERLAP_MS);
    expect(start < mark).toBe(true);
  });

  it("does a full re-pull from the epoch when the mark is unset or unparseable", () => {
    expect(pullWindowStart(null)).toBe("1970-01-01T00:00:00.000Z");
    expect(pullWindowStart("not-a-date")).toBe("1970-01-01T00:00:00.000Z");
  });

  it("never goes below the epoch even for a very early mark", () => {
    expect(pullWindowStart("1970-01-01T00:01:00.000Z")).toBe("1970-01-01T00:00:00.000Z");
  });

  it("heals a poisoned (future) mark by treating it as unset → full re-pull", () => {
    const now = "2026-06-01T12:00:00.000Z";
    const future = "2027-01-01T00:00:00.000Z";
    expect(healHighWater(future, now)).toBeNull(); // poisoned → reset
    expect(healHighWater("2026-05-01T00:00:00.000Z", now)).toBe("2026-05-01T00:00:00.000Z"); // sane → kept
    expect(healHighWater(null, now)).toBeNull();
  });

  it("never persists a mark past now (one future-stamped row can't freeze pulls)", () => {
    const now = "2026-06-01T12:00:00.000Z";
    expect(boundHighWater("2030-01-01T00:00:00.000Z", now)).toBe(now); // capped
    expect(boundHighWater("2026-05-01T00:00:00.000Z", now)).toBe("2026-05-01T00:00:00.000Z"); // kept
  });
});
