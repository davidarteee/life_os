"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Habit } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useGameConfig } from "@/hooks/use-game";
import { toggleHabitAction } from "@/lib/data/actions";
import { dayKey } from "@/lib/date";

/** Toggle a habit and surface XP / bonus / achievement feedback as toasts. */
export function useToggleHabit(day: string = dayKey()) {
  const { user } = useSession();
  const config = useGameConfig();

  return useCallback(
    async (habit: Habit) => {
      if (!user) return;
      const outcome = await toggleHabitAction(user.id, habit, config, day);

      if (outcome.becameCompleted && outcome.xpDelta > 0) {
        toast.success(`${habit.name}`, { description: `+${outcome.xpDelta} XP` });
      }
      if (outcome.bonusDelta > 0) {
        toast("Perfect day!", { description: `All habits done — +${outcome.bonusDelta} XP bonus` });
      }
      for (const u of outcome.unlocks) {
        toast(`🏆 ${u.title}`, { description: `Achievement unlocked — +${u.xpReward} XP` });
      }
    },
    [user, config, day],
  );
}
