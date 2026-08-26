"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Task } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useGameConfig } from "@/hooks/use-game";
import { toggleTaskAction } from "@/lib/data/actions";

/** Toggle a task done/undone with XP + achievement feedback. */
export function useToggleTask() {
  const { user } = useSession();
  const config = useGameConfig();

  return useCallback(
    async (task: Task) => {
      if (!user) return;
      const outcome = await toggleTaskAction(user.id, task, config);
      if (outcome.becameDone && outcome.xpDelta > 0) {
        toast.success(task.title, { description: `+${outcome.xpDelta} XP` });
      }
      for (const u of outcome.unlocks) {
        toast(`🏆 ${u.title}`, { description: `+${u.xpReward} XP` });
      }
    },
    [user, config],
  );
}
