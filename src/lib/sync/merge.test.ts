import { describe, it, expect } from "vitest";
import { shouldApplyRemote } from "@/lib/sync/sync-engine";

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
