"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { db } from "@/lib/db/dexie";
import { activeRecords } from "@/lib/data/repository";
import { readGameState, listUserAchievements, listChallenges, listFreeDays, activeChallenge, listXpEvents } from "@/lib/data/game";
import { readSettings } from "@/lib/data/settings";
import { levelProgress } from "@/lib/game/xp";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/config";
import type { GameState, UserSettings, UserAchievement, Challenge, FreeDay, XpEvent } from "@/lib/types";

export function useGameState() {
  const uid = useUserId();
  const state = useLiveQuery(async () => (uid ? readGameState(uid) : null), [uid]);
  const progress = state ? levelProgress(state.xp) : null;
  return { state: state ?? null, progress };
}

export function useSettings() {
  const uid = useUserId();
  const settings = useLiveQuery(async () => (uid ? readSettings(uid) : null), [uid]);
  return settings ?? null;
}

export function useGameConfig() {
  const settings = useSettings();
  return settings?.game ?? DEFAULT_GAME_CONFIG;
}

export function useUserAchievements() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listUserAchievements(uid) : []), [uid]) ?? [];
}

export function useChallenges() {
  const uid = useUserId();
  const all = useLiveQuery(async () => (uid ? listChallenges(uid) : []), [uid]) ?? [];
  const active = useLiveQuery(async () => (uid ? (await activeChallenge(uid)) ?? null : null), [uid]) ?? null;
  return { all, active };
}

export function useFreeDays() {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listFreeDays(uid) : []), [uid]) ?? [];
}

export function useXpEvents(limit = 30) {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listXpEvents(uid, limit) : []), [uid, limit]) ?? [];
}

export type { GameState, UserSettings, UserAchievement, Challenge, FreeDay, XpEvent };
export { db, activeRecords };
