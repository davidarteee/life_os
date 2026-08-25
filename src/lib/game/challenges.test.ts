import { describe, it, expect } from "vitest";
import { pickWeightedChallenge, CHALLENGES } from "@/lib/game/challenges-def";

describe("challenge roulette selection", () => {
  it("always returns a defined challenge from the pool", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      const c = pickWeightedChallenge(r);
      expect(CHALLENGES).toContainEqual(c);
    }
  });

  it("respects weighting boundaries deterministically", () => {
    expect(pickWeightedChallenge(0)).toBe(CHALLENGES[0]);
    // The last slice of the distribution lands on a low-weight challenge.
    expect(pickWeightedChallenge(0.999).id).toBeTruthy();
  });

  it("covers a spread of outcomes across the range", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickWeightedChallenge(i / 200).id);
    expect(seen.size).toBeGreaterThan(3);
  });
});
