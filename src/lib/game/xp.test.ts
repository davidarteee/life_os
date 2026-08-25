import { describe, it, expect } from "vitest";
import { xpToNextLevel, cumulativeXpForLevel, levelProgress, levelTitle } from "@/lib/game/xp";

describe("xp/level math", () => {
  it("requires strictly more XP for each successive level", () => {
    for (let l = 1; l < 50; l++) {
      expect(xpToNextLevel(l + 1)).toBeGreaterThan(xpToNextLevel(l));
    }
  });

  it("starts a fresh account at level 1 with zero progress", () => {
    const p = levelProgress(0);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.ratio).toBe(0);
  });

  it("levels up exactly at the cumulative threshold", () => {
    const threshold = cumulativeXpForLevel(2); // XP needed to reach level 2
    expect(levelProgress(threshold - 1).level).toBe(1);
    expect(levelProgress(threshold).level).toBe(2);
  });

  it("keeps progress within the current level bounds", () => {
    const p = levelProgress(250);
    expect(p.xpIntoLevel).toBeGreaterThanOrEqual(0);
    expect(p.xpIntoLevel).toBeLessThan(p.xpForLevel);
    expect(p.levelCeil - p.levelFloor).toBe(p.xpForLevel);
    expect(p.ratio).toBeGreaterThanOrEqual(0);
    expect(p.ratio).toBeLessThanOrEqual(1);
  });

  it("is monotonic in level as XP increases", () => {
    let last = 1;
    for (let xp = 0; xp < 20000; xp += 137) {
      const lvl = levelProgress(xp).level;
      expect(lvl).toBeGreaterThanOrEqual(last);
      last = lvl;
    }
  });

  it("assigns escalating titles", () => {
    expect(levelTitle(1)).toBe("Novice");
    expect(levelTitle(10)).toBe("Adept");
    expect(levelTitle(100)).toBe("Ascended");
  });
});
