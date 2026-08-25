"use client";

import { useEffect, useState } from "react";
import { HeartCrack, Dices } from "lucide-react";
import { CHALLENGES, pickWeightedChallenge, type ChallengeDef } from "@/lib/game/challenges-def";
import { describeChallenge } from "@/lib/i18n/content";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

const ROW_H = 60;
const WINDOW_ROWS = 5;
const CENTER = Math.floor(WINDOW_ROWS / 2);
const SPIN_ROWS = 34; // how many rows scroll past before the winner lands

type Phase = "idle" | "spinning" | "done";

function buildReel(winner: ChallengeDef): { reel: ChallengeDef[]; winnerIndex: number } {
  const rand = () => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const lead = Array.from({ length: SPIN_ROWS }, rand);
  const winnerIndex = lead.length;
  const tail = Array.from({ length: WINDOW_ROWS }, rand);
  return { reel: [...lead, winner, ...tail], winnerIndex };
}

/**
 * Full-screen "you lost all your lives" roulette. Spinning is theatre — the
 * true outcome is chosen up front via weighted random, then the reel animates
 * to land on it. Accepting creates the challenge (handled by the parent).
 */
export function ChallengeRoulette({ onAccept }: { onAccept: (def: ChallengeDef) => void }) {
  const { t, locale } = useT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [offset, setOffset] = useState(0);
  const [transition, setTransition] = useState(false);
  const [winner, setWinner] = useState<ChallengeDef | null>(null);
  const [reel, setReel] = useState<ChallengeDef[]>(() => Array.from({ length: WINDOW_ROWS + 2 }, (_, i) => CHALLENGES[i % CHALLENGES.length]));

  function spin() {
    if (phase === "spinning") return;
    const picked = pickWeightedChallenge();
    setWinner(picked);
    const { reel: built, winnerIndex } = buildReel(picked);
    setReel(built);
    setTransition(false);
    setOffset(0);
    setPhase("spinning");
    // Next frame: enable the long eased transition to the winning row.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransition(true);
        setOffset((winnerIndex - CENTER) * ROW_H);
      });
    });
  }

  const windowHeight = WINDOW_ROWS * ROW_H;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/85 px-4 backdrop-blur-md">
      <div className="aurora pointer-events-none absolute inset-0 opacity-20" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 animate-pop-in">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-life/15 text-life">
            <HeartCrack className="size-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("challenge.lostAll")}
          </h2>
          <p className="max-w-xs text-sm text-white/60">{t("challenge.explainVerify")}</p>
        </div>

        {/* Reel window */}
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          style={{ height: windowHeight }}
        >
          {/* center highlight */}
          <div
            className="pointer-events-none absolute inset-x-0 z-20 border-y-2 border-primary/70 bg-primary/10"
            style={{ top: CENTER * ROW_H, height: ROW_H }}
          />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
          <div
            className={cn("will-change-transform", transition && "transition-transform duration-[3800ms] ease-[cubic-bezier(.12,.7,.16,1)]")}
            style={{ transform: `translateY(-${offset}px)` }}
          >
            {reel.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-center px-4 text-center"
                style={{ height: ROW_H }}
              >
                <span className="font-heading text-lg font-semibold text-white/90">{describeChallenge(locale, c.id).title}</span>
              </div>
            ))}
          </div>
        </div>

        {phase === "idle" && (
          <Button size="lg" onClick={spin} className="gap-2">
            <Dices className="size-5" /> {t("challenge.spin")}
          </Button>
        )}
        {phase === "spinning" && (
          <>
            <p className="text-sm text-white/60">{t("challenge.spinning")}</p>
            <ReelResolver onDone={() => setPhase("done")} />
          </>
        )}
        {phase === "done" && winner && (
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-card/80 p-4 text-center animate-pop-in">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t("challenge.yourChallenge")}</span>
            <p className="font-heading text-xl font-bold">{describeChallenge(locale, winner.id).title}</p>
            <p className="text-sm text-muted-foreground">{describeChallenge(locale, winner.id).description}</p>
            <Button className="mt-1 w-full" size="lg" onClick={() => onAccept(winner)}>
              {t("challenge.accept")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Fires onDone once the reel animation duration elapses (matches CSS timing). */
function ReelResolver({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3900);
    return () => clearTimeout(id);
  }, [onDone]);
  return null;
}
