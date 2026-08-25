"use client";

import { FlaskConical, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useGameState, useGameConfig } from "@/hooks/use-game";
import { setLives, awardXp } from "@/lib/data/game";
import { XP_REASON } from "@/lib/game/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Honest, clearly-labeled testing helpers. Lives normally change only through
 * the real rules (missed required habits, the shop, challenge verification);
 * these let you exercise the flow — especially the 0-lives roulette — on demand.
 */
export function TestingTools() {
  const { user } = useSession();
  const { state } = useGameState();
  const config = useGameConfig();
  const [open, setOpen] = useState(false);
  if (!user || !state) return null;

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-card/40">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm">
        <FlaskConical className="size-4 text-warning" />
        <span className="font-medium">Testing tools</span>
        <span className="text-xs text-muted-foreground">simulate rules</span>
        <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 border-t border-border/60 p-4">
          <Button size="sm" variant="outline" onClick={() => setLives(user.id, Math.max(0, state.lives - 1), config.lives.maxLives)}>
            −1 life
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLives(user.id, 0, config.lives.maxLives)}>
            Lose all lives
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLives(user.id, config.lives.maxLives, config.lives.maxLives)}>
            Restore lives
          </Button>
          <Button size="sm" variant="outline" onClick={() => { awardXp(user.id, 100, XP_REASON.levelAdjust); toast.success("+100 XP"); }}>
            +100 XP
          </Button>
        </div>
      )}
    </div>
  );
}
