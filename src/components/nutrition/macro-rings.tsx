"use client";

import type { Macros, NutritionTargets } from "@/lib/types";
import { progress } from "@/lib/nutrition/macros";
import { MACRO_META, type MacroKey } from "@/components/nutrition/meta";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** A single progress ring drawn with SVG stroke-dashoffset. */
export function MacroRing({
  value,
  target,
  color,
  size = 72,
  stroke = 7,
  children,
}: {
  value: number;
  target: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = progress(value, target); // clamped 0..1
  const over = target > 0 && value > target;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} opacity={0.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--destructive)" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">{children}</div>
    </div>
  );
}

function pct(value: number, target: number) {
  return target > 0 ? Math.round((value / target) * 100) : 0;
}

/**
 * The day's macros at a glance: a hero calories ring plus a row of protein,
 * carbs and fat rings. Consumed vs target is immediately legible; over-target
 * turns the ring red. Fully driven by theme color tokens.
 */
export function MacroRings({ totals, targets }: { totals: Macros; targets: NutritionTargets }) {
  const { t } = useT();
  const cal = MACRO_META[0];
  const macros = MACRO_META.slice(1);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
      {/* Hero calories ring */}
      <MacroRing value={totals.calories} target={targets.calories} color={cal.color} size={132} stroke={11}>
        <div>
          <p className="font-heading text-2xl font-bold tabular-nums">{Math.round(totals.calories)}</p>
          <p className="text-[11px] text-muted-foreground">/ {targets.calories} {t("nutrition.kcal")}</p>
          <p className="mt-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">{pct(totals.calories, targets.calories)}%</p>
        </div>
      </MacroRing>

      {/* Macro rings */}
      <div className="grid grid-cols-3 gap-4">
        {macros.map((m) => {
          const value = totals[m.key as MacroKey];
          const target = targets[m.key as MacroKey];
          return (
            <div key={m.key} className="flex flex-col items-center gap-1.5">
              <MacroRing value={value} target={target} color={m.color} size={78} stroke={7}>
                <div>
                  <p className="font-heading text-sm font-bold tabular-nums">{Math.round(value)}</p>
                  <p className="text-[9px] text-muted-foreground">/{Math.round(target)}g</p>
                </div>
              </MacroRing>
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: m.color }} />
                <span className="text-[11px] font-medium">{t(m.labelKey)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact horizontal macro bars — used where a full ring set is too large. */
export function MacroBars({ totals, targets, className }: { totals: Macros; targets: NutritionTargets; className?: string }) {
  const { t } = useT();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {MACRO_META.map((m) => {
        const value = totals[m.key as MacroKey];
        const target = targets[m.key as MacroKey];
        const ratio = progress(value, target);
        const over = target > 0 && value > target;
        return (
          <div key={m.key}>
            <div className="mb-0.5 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: m.color }} />
                {t(m.labelKey)}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {Math.round(value)} / {Math.round(target)} {m.unit === "kcal" ? t("nutrition.kcal") : "g"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${ratio * 100}%`, background: over ? "var(--destructive)" : m.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
