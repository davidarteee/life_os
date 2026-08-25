"use client";

import { useSession } from "@/components/providers/session-provider";
import { useGameState, useChallenges } from "@/hooks/use-game";
import { ChallengeRoulette } from "@/components/game/challenge-roulette";
import { createChallenge } from "@/lib/data/game";
import type { ChallengeDef } from "@/lib/game/challenges-def";
import { toast } from "sonner";

/**
 * Global sentinel: when the user has 0 lives and no active challenge, present
 * the roulette. Mounted once in the app shell so it fires from anywhere.
 */
export function ChallengeWatcher() {
  const { user } = useSession();
  const { state } = useGameState();
  const { active } = useChallenges();

  const shouldShow = !!user && !!state && state.lives === 0 && !active;
  if (!shouldShow) return null;

  const onAccept = async (def: ChallengeDef) => {
    if (!user) return;
    await createChallenge(user.id, def);
    toast("Challenge accepted", { description: `${def.title} — verify your evidence to restore your lives.` });
  };

  return <ChallengeRoulette onAccept={onAccept} />;
}
