"use client";

import { useSession } from "@/components/providers/session-provider";
import { useGameState, useChallenges } from "@/hooks/use-game";
import { ChallengeRoulette } from "@/components/game/challenge-roulette";
import { createChallenge } from "@/lib/data/game";
import type { ChallengeDef } from "@/lib/game/challenges-def";
import { describeChallenge } from "@/lib/i18n/content";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

/**
 * Global sentinel: when the user has 0 lives and no active challenge, present
 * the roulette. Mounted once in the app shell so it fires from anywhere.
 */
export function ChallengeWatcher() {
  const { user } = useSession();
  const { state } = useGameState();
  const { active } = useChallenges();
  const { t, locale } = useT();

  const shouldShow = !!user && !!state && state.lives === 0 && !active;
  if (!shouldShow) return null;

  const onAccept = async (def: ChallengeDef) => {
    if (!user) return;
    await createChallenge(user.id, def);
    const title = describeChallenge(locale, def.id).title;
    toast(t("challenge.accepted"), { description: t("challenge.acceptedDesc", { title }) });
  };

  return <ChallengeRoulette onAccept={onAccept} />;
}
