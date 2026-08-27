"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/providers/session-provider";
import { useGameConfig } from "@/hooks/use-game";
import { useT } from "@/hooks/use-t";
import { logFood, updateFoodEntry, removeFoodEntry, type FoodEntryInput } from "@/lib/data/nutrition";
import { reconcileNutrition } from "@/lib/data/actions";
import type { FoodEntry } from "@/lib/types";

/**
 * Food-log mutations that keep gamification in sync: after every change to a
 * day's entries we reconcile the once-per-day "nutrition targets met" XP and
 * celebrate any newly-unlocked achievement. The reconcile is idempotent — the
 * XP is awarded at most once per day and reversed if an edit drops the day
 * below target.
 */
export function useNutritionActions() {
  const { user } = useSession();
  const config = useGameConfig();
  const { t } = useT();

  const reconcile = useCallback(
    async (day: string) => {
      if (!user) return;
      const outcome = await reconcileNutrition(user.id, day, config);
      if (outcome.xpDelta > 0) {
        toast.success(t("nutrition.targetsMet"), { description: `+${outcome.xpDelta} XP` });
      }
      for (const u of outcome.unlocks) {
        toast(`🏆 ${u.title}`, { description: `+${u.xpReward} XP` });
      }
    },
    [user, config, t],
  );

  const log = useCallback(
    async (input: FoodEntryInput) => {
      if (!user) return;
      await logFood(user.id, input);
      toast.success(t("nutrition.logged"), { description: input.name });
      await reconcile(input.day);
    },
    [user, t, reconcile],
  );

  const update = useCallback(
    async (entry: FoodEntry) => {
      if (!user) return;
      await updateFoodEntry(user.id, entry);
      await reconcile(entry.day);
    },
    [user, reconcile],
  );

  const remove = useCallback(
    async (entry: FoodEntry) => {
      if (!user) return;
      await removeFoodEntry(user.id, entry.id);
      toast.success(t("nutrition.entryRemoved"));
      await reconcile(entry.day);
    },
    [user, t, reconcile],
  );

  return { log, update, remove };
}
