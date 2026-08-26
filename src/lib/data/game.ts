import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import type {
  GameState,
  XpEvent,
  FreeDay,
  ShopPurchase,
  UserAchievement,
  Challenge,
  ChallengeEvidence,
  GameConfig,
  ShopItemId,
  FreeDayKind,
} from "@/lib/types";
import { dayKey, shiftDayKey, fromDayKey } from "@/lib/date";
import { levelProgress } from "@/lib/game/xp";
import {
  currentStreak,
  evaluateDay,
  resolveAchievements,
  type AchievementCounters,
} from "@/lib/game/engine";
import { ACHIEVEMENTS_BY_ID } from "@/lib/game/achievements-def";
import { CHALLENGES_BY_ID, type ChallengeDef } from "@/lib/game/challenges-def";
import { XP_REASON } from "@/lib/game/config";
import { listHabits, allLogs, isScheduledOn } from "@/lib/data/habits";
import { newId, deterministicId } from "@/lib/id";

const gs = (userId: string) => ({ table: db().gameState, syncTable: "game_state" as const, userId });
const xp = (userId: string) => ({ table: db().xpEvents, syncTable: "xp_events" as const, userId });
const fd = (userId: string) => ({ table: db().freeDays, syncTable: "free_days" as const, userId });
const sp = (userId: string) => ({ table: db().shopPurchases, syncTable: "shop_purchases" as const, userId });
const ua = (userId: string) => ({ table: db().userAchievements, syncTable: "user_achievements" as const, userId });
const ch = (userId: string) => ({ table: db().challenges, syncTable: "challenges" as const, userId });

/* --------------------------------------------------------- Game state ----- */

/** Read-only game-state lookup — safe inside a Dexie liveQuery (never writes). */
export async function readGameState(userId: string): Promise<GameState | null> {
  return (await db().gameState.where("user_id").equals(userId).first()) ?? null;
}

export async function getGameState(userId: string): Promise<GameState> {
  const existing = await db().gameState.where("user_id").equals(userId).first();
  if (existing) return existing;
  // Deterministic id (valid UUID format) so two devices creating the singleton
  // before syncing produce the SAME id and merge instead of duplicating.
  const created = makeRecord<GameState>(userId, {
    id: deterministicId(`${userId}:game_state`),
    xp: 0,
    spendableXp: 0,
    level: 1,
    lives: 3,
    streakShields: 0,
  });
  return upsert(gs(userId), created);
}

export interface XpResult {
  state: GameState;
  leveledUp: boolean;
  fromLevel: number;
  toLevel: number;
}

/** Award (positive) or deduct (negative) XP, writing to the append-only ledger. */
export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  opts: { day?: string; meta?: Record<string, unknown>; spendableOnly?: boolean } = {},
): Promise<XpResult> {
  const state = await getGameState(userId);
  const day = opts.day ?? dayKey();
  const fromLevel = state.level;

  const nextXp = opts.spendableOnly ? state.xp : Math.max(0, state.xp + amount);
  const nextSpendable = Math.max(0, state.spendableXp + amount);
  const toLevel = levelProgress(nextXp).level;

  const nextState: GameState = { ...state, xp: nextXp, spendableXp: nextSpendable, level: toLevel };
  const saved = await upsert(gs(userId), nextState);

  const event = makeRecord<XpEvent>(userId, { amount, reason, meta: opts.meta, day });
  await upsert(xp(userId), event);

  return { state: saved, leveledUp: toLevel > fromLevel, fromLevel, toLevel };
}

/** Directly set lives (used by the shop, challenge verification, and testing tools). */
export async function setLives(userId: string, lives: number, max = 3): Promise<GameState> {
  const state = await getGameState(userId);
  return upsert(gs(userId), { ...state, lives: Math.max(0, Math.min(max, lives)) });
}

export async function listXpEvents(userId: string, limit = 50): Promise<XpEvent[]> {
  const rows = activeRecords(await db().xpEvents.where("user_id").equals(userId).toArray());
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

/* --------------------------------------------------------- Free days ------ */

export async function listFreeDays(userId: string): Promise<FreeDay[]> {
  return activeRecords(await db().freeDays.where("user_id").equals(userId).toArray());
}

export async function isFreeDay(userId: string, day: string): Promise<boolean> {
  const rows = await db().freeDays.where("[user_id+day]").equals([userId, day]).toArray();
  return activeRecords(rows).length > 0;
}

export async function addFreeDay(
  userId: string,
  day: string,
  kind: FreeDayKind,
  note?: string,
): Promise<FreeDay> {
  const existing = activeRecords(
    await db().freeDays.where("[user_id+day]").equals([userId, day]).toArray(),
  )[0];
  if (existing) return existing;
  return upsert(fd(userId), makeRecord<FreeDay>(userId, { day, kind, note }));
}

export async function removeFreeDay(userId: string, id: string): Promise<void> {
  await softDelete(fd(userId), id);
}

/* --------------------------------------------------------- Shop ----------- */

export interface ShopResult {
  ok: boolean;
  reason?: "insufficient" | "max_lives" | "invalid";
  state?: GameState;
}

export async function buyShopItem(
  userId: string,
  item: ShopItemId,
  config: GameConfig,
  opts: { day?: string } = {},
): Promise<ShopResult> {
  const state = await getGameState(userId);
  const cost = config.shop[item];
  if (state.spendableXp < cost) return { ok: false, reason: "insufficient" };
  if (item === "extra_life" && state.lives >= config.lives.maxLives) {
    return { ok: false, reason: "max_lives" };
  }

  // Deduct XP from the wallet (lifetime XP unaffected).
  await awardXp(userId, -cost, XP_REASON.shopSpend, { spendableOnly: true, meta: { item } });

  let next = await getGameState(userId);
  if (item === "extra_life") {
    next = await upsert(gs(userId), { ...next, lives: Math.min(config.lives.maxLives, next.lives + 1) });
  } else if (item === "streak_shield") {
    next = await upsert(gs(userId), { ...next, streakShields: next.streakShields + 1 });
  } else if (item === "free_day") {
    await addFreeDay(userId, opts.day ?? dayKey(), "purchased", "Purchased with XP");
  }

  await upsert(sp(userId), makeRecord<ShopPurchase>(userId, { item, cost, day: opts.day ?? dayKey() }));
  return { ok: true, state: next };
}

/* --------------------------------------------------- Lives reconciliation - */

export interface ReconcileResult {
  state: GameState;
  livesLost: number;
  daysEvaluated: string[];
  hitZero: boolean;
}

/**
 * Walk every fully-past day since the last evaluation and deduct a life for any
 * day that missed the required-habit threshold and wasn't a free day. Runs once
 * per day (idempotent via lastEvaluatedDay). Today is never evaluated until it
 * is in the past. When lives hit zero, the UI takes over with the challenge
 * roulette — reconciliation only lowers the counter.
 */
export async function reconcileLives(
  userId: string,
  config: GameConfig,
  today: string = dayKey(),
): Promise<ReconcileResult> {
  let state = await getGameState(userId);
  const yesterday = shiftDayKey(today, -1);

  // First run: start the clock at yesterday, don't punish pre-history.
  if (!state.lastEvaluatedDay) {
    state = await upsert(gs(userId), { ...state, lastEvaluatedDay: yesterday });
    return { state, livesLost: 0, daysEvaluated: [], hitZero: false };
  }
  if (state.lastEvaluatedDay >= yesterday) {
    return { state, livesLost: 0, daysEvaluated: [], hitZero: false };
  }

  const habits = await listHabits(userId);
  const requiredHabits = habits.filter((h) => h.required);
  const logs = await allLogs(userId);
  const freeDays = new Set((await listFreeDays(userId)).map((f) => f.day));

  const completedByDay = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!log.completed) continue;
    if (!completedByDay.has(log.day)) completedByDay.set(log.day, new Set());
    completedByDay.get(log.day)!.add(log.habitId);
  }

  let livesLost = 0;
  const evaluated: string[] = [];
  let cursor = shiftDayKey(state.lastEvaluatedDay, 1);
  while (cursor <= yesterday) {
    const weekday = (fromDayKey(cursor).getDay() + 6) % 7;
    const scheduled = requiredHabits.filter((h) => isScheduledOn(h, weekday));
    const done = completedByDay.get(cursor) ?? new Set<string>();
    const evalResult = evaluateDay({
      requiredHabitIds: scheduled.map((h) => h.id),
      completedRequiredIds: done,
      isFreeDay: freeDays.has(cursor),
      missThreshold: config.lives.missThreshold,
    });
    if (evalResult.costsLife && state.lives > 0) {
      if (state.streakShields > 0) {
        state = { ...state, streakShields: state.streakShields - 1 };
      } else {
        state = { ...state, lives: Math.max(0, state.lives - 1) };
        livesLost += 1;
      }
    }
    evaluated.push(cursor);
    cursor = shiftDayKey(cursor, 1);
  }

  state = await upsert(gs(userId), { ...state, lastEvaluatedDay: yesterday });
  return { state, livesLost, daysEvaluated: evaluated, hitZero: state.lives === 0 };
}

/* --------------------------------------------------- Challenges ----------- */

export async function activeChallenge(userId: string): Promise<Challenge | undefined> {
  const rows = activeRecords(await db().challenges.where("user_id").equals(userId).toArray());
  return rows.find((c) => c.status === "active" || c.status === "submitted");
}

export async function listChallenges(userId: string): Promise<Challenge[]> {
  const rows = activeRecords(await db().challenges.where("user_id").equals(userId).toArray());
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createChallenge(userId: string, def: ChallengeDef): Promise<Challenge> {
  const existing = await activeChallenge(userId);
  if (existing) return existing;
  return upsert(
    ch(userId),
    makeRecord<Challenge>(userId, {
      defId: def.id,
      title: def.title,
      description: def.description,
      metricLabel: def.metricLabel,
      status: "active",
      assignedDay: dayKey(),
      evidence: [],
    }),
  );
}

export async function addChallengeEvidence(
  userId: string,
  challenge: Challenge,
  evidence: Omit<ChallengeEvidence, "id" | "addedAt">,
): Promise<Challenge> {
  const item: ChallengeEvidence = { ...evidence, id: newId(), addedAt: new Date().toISOString() };
  return upsert(ch(userId), { ...challenge, evidence: [...challenge.evidence, item] });
}

export async function updateChallenge(userId: string, challenge: Challenge): Promise<Challenge> {
  return upsert(ch(userId), challenge);
}

export async function submitChallenge(userId: string, challenge: Challenge): Promise<Challenge> {
  return upsert(ch(userId), { ...challenge, status: "submitted" });
}

/**
 * Verify a submitted challenge. Only now are the user's lives restored to full,
 * per spec — never automatically on submission.
 */
export async function verifyChallenge(
  userId: string,
  challenge: Challenge,
  config: GameConfig,
): Promise<{ challenge: Challenge; state: GameState }> {
  const verified = await upsert(ch(userId), {
    ...challenge,
    status: "verified",
    verifiedAt: new Date().toISOString(),
  });
  await awardXp(userId, 100, XP_REASON.challengeVerified, { meta: { challengeId: challenge.id } });
  const state = await getGameState(userId);
  const restored = await upsert(gs(userId), { ...state, lives: config.lives.maxLives });
  return { challenge: verified, state: restored };
}

/* --------------------------------------------------- Achievements --------- */

export async function computeCounters(userId: string): Promise<AchievementCounters> {
  const habits = await listHabits(userId, true);
  const requiredIds = new Set(habits.filter((h) => h.required).map((h) => h.id));
  const logs = await allLogs(userId);
  const state = await getGameState(userId);
  const challenges = await listChallenges(userId);
  const freeDays = await listFreeDays(userId);

  const habitsCompleted = logs.filter((l) => l.completed).length;

  // Best current streak across habits.
  const perHabitDays = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!l.completed) continue;
    if (!perHabitDays.has(l.habitId)) perHabitDays.set(l.habitId, new Set());
    perHabitDays.get(l.habitId)!.add(l.day);
  }
  const today = dayKey();
  let habitStreak = 0;
  for (const days of perHabitDays.values()) {
    habitStreak = Math.max(habitStreak, currentStreak(days, today));
  }

  // Perfect days: every required habit that day completed (and at least one required exists).
  const completedByDay = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!l.completed || !requiredIds.has(l.habitId)) continue;
    if (!completedByDay.has(l.day)) completedByDay.set(l.day, new Set());
    completedByDay.get(l.day)!.add(l.habitId);
  }
  let perfectDays = 0;
  for (const [, done] of completedByDay) {
    if (requiredIds.size > 0 && done.size === requiredIds.size) perfectDays += 1;
  }

  const tasksCompleted = activeRecords(await db().tasks.where("user_id").equals(userId).toArray()).filter(
    (t) => t.status === "done",
  ).length;

  return {
    habitsCompleted,
    habitStreak,
    perfectDays,
    tasksCompleted,
    level: state.level,
    challengesVerified: challenges.filter((c) => c.status === "verified").length,
    xpTotal: state.xp,
    freeDaysUsed: freeDays.length,
  };
}

export async function listUserAchievements(userId: string): Promise<UserAchievement[]> {
  return activeRecords(await db().userAchievements.where("user_id").equals(userId).toArray());
}

export interface AchievementUnlock {
  achievementId: string;
  title: string;
  xpReward: number;
}

/**
 * Recompute achievement progress from live counters, persist changes, and award
 * XP for anything that just unlocked. Returns the newly unlocked list so the UI
 * can celebrate. Safe to call after any XP-affecting action.
 */
export async function recomputeAchievements(userId: string): Promise<AchievementUnlock[]> {
  const counters = await computeCounters(userId);
  const existing = await listUserAchievements(userId);
  const byAch = new Map(existing.map((e) => [e.achievementId, e]));
  const alreadyUnlocked = new Set(existing.filter((e) => e.unlocked).map((e) => e.achievementId));

  const resolutions = resolveAchievements(counters, alreadyUnlocked);
  const unlocks: AchievementUnlock[] = [];

  for (const r of resolutions) {
    const prev = byAch.get(r.achievementId);
    const changed = !prev || prev.progress !== r.progress || prev.unlocked !== r.unlocked;
    if (changed) {
      const record: UserAchievement =
        prev != null
          ? { ...prev, progress: r.progress, unlocked: r.unlocked, unlockedAt: r.justUnlocked ? new Date().toISOString() : prev.unlockedAt }
          : makeRecord<UserAchievement>(userId, {
              achievementId: r.achievementId,
              progress: r.progress,
              unlocked: r.unlocked,
              unlockedAt: r.justUnlocked ? new Date().toISOString() : undefined,
            });
      await upsert(ua(userId), record);
    }
    if (r.justUnlocked) {
      const def = ACHIEVEMENTS_BY_ID.get(r.achievementId);
      if (def) {
        await awardXp(userId, def.xpReward, XP_REASON.achievement, { meta: { achievementId: def.id } });
        unlocks.push({ achievementId: def.id, title: def.title, xpReward: def.xpReward });
      }
    }
  }
  return unlocks;
}

export { CHALLENGES_BY_ID };
