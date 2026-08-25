"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/habits/progress-ring";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

const FOCUS = 25 * 60;
const BREAK = 5 * 60;

/** A real 25/5 Pomodoro timer. (Session logging to Study is a roadmap hook.) */
export function PomodoroWidget() {
  const { t } = useT();
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [remaining, setRemaining] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          const nextMode = mode === "focus" ? "break" : "focus";
          setMode(nextMode);
          setRunning(false);
          return nextMode === "focus" ? FOCUS : BREAK;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, mode]);

  const total = mode === "focus" ? FOCUS : BREAK;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  function reset() {
    setRunning(false);
    setRemaining(mode === "focus" ? FOCUS : BREAK);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex gap-1 rounded-full bg-muted p-0.5 text-xs">
        {(["focus", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setRunning(false); setRemaining(m === "focus" ? FOCUS : BREAK); }}
            className={cn("rounded-full px-3 py-1 transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            {m === "focus" ? t("widgets.focus") : t("widgets.break")}
          </button>
        ))}
      </div>
      <ProgressRing value={1 - remaining / total} size={104} stroke={7}>
        <span className="font-heading text-2xl font-bold tabular-nums">{mm}:{ss}</span>
      </ProgressRing>
      <div className="flex gap-2">
        <Button size="icon" variant={running ? "outline" : "default"} onClick={() => setRunning((r) => !r)} aria-label={running ? "Pause" : "Start"}>
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button size="icon" variant="outline" onClick={reset} aria-label="Reset">
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
