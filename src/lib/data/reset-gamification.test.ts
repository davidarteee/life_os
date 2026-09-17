// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { resetLocalDatabase } from "@/lib/db/dexie";
import {
  awardXp, recomputeAchievements, resetGamification,
  readGameState, listXpEvents, listUserAchievements, computeCounters,
} from "@/lib/data/game";
import { createHabit, advanceHabit } from "@/lib/data/habits";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/config";
import { XP_REASON } from "@/lib/game/config";
import { dayKey } from "@/lib/date";

const UID = "99999999-9999-9999-9999-999999999999";
const tick = () => new Promise((r) => setTimeout(r, 5));

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("resetGamification", () => {
  it("zeroes XP/level/achievements, refills lives, and stops history re-awarding", async () => {
    const habit = await createHabit(UID, { name: "Read" });
    await advanceHabit(UID, habit, dayKey()); // a completed log (pre-reset)
    await awardXp(UID, 500, XP_REASON.habitComplete);
    await recomputeAchievements(UID);

    expect((await readGameState(UID))!.xp).toBeGreaterThan(0);
    expect((await listUserAchievements(UID)).length).toBeGreaterThan(0);

    await tick(); // ensure the reset stamp is strictly after the pre-reset records
    await resetGamification(UID, DEFAULT_GAME_CONFIG);

    const st = (await readGameState(UID))!;
    expect(st.xp).toBe(0);
    expect(st.level).toBe(1);
    expect(st.lives).toBe(DEFAULT_GAME_CONFIG.lives.maxLives);
    expect(st.gamificationResetAt).toBeTruthy();

    expect(await listXpEvents(UID)).toHaveLength(0); // ledger cleared
    expect(await listUserAchievements(UID)).toHaveLength(0); // achievements cleared

    // Counters ignore pre-reset history, so a later recompute won't re-award it.
    const counters = await computeCounters(UID);
    expect(counters.xpTotal).toBe(0);
    expect(counters.habitsCompleted).toBe(0);

    const unlocks = await recomputeAchievements(UID);
    expect(unlocks).toHaveLength(0);
    expect((await readGameState(UID))!.xp).toBe(0); // stays at zero
  });
});
