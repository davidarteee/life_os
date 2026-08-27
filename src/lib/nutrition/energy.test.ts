import { describe, it, expect } from "vitest";
import { computeEnergyBalance } from "@/lib/nutrition/energy";
import type { Macros, NutritionConfig } from "@/lib/types";

const consumed: Macros = { calories: 1800, protein: 120, carbs: 180, fat: 60 };
const cfg = (over: Partial<NutritionConfig> = {}): NutritionConfig => ({
  targets: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  energyMode: "informational",
  exerciseFactor: 0.5,
  ...over,
});

describe("energy balance", () => {
  it("informational mode never changes the target", () => {
    const e = computeEnergyBalance(consumed, 400, cfg());
    expect(e.targetCalories).toBe(2000);
    expect(e.effectiveTarget).toBe(2000); // unchanged
    expect(e.exerciseCredit).toBe(0);
    expect(e.burned).toBe(400);
    expect(e.net).toBe(1400); // 1800 - 400
    expect(e.remaining).toBe(200); // 2000 - 1800
  });

  it("adjustTarget mode adds burned × factor to the target, transparently", () => {
    const e = computeEnergyBalance(consumed, 400, cfg({ energyMode: "adjustTarget", exerciseFactor: 0.5 }));
    expect(e.exerciseCredit).toBe(200); // 400 × 0.5
    expect(e.effectiveTarget).toBe(2200); // 2000 + 200
    expect(e.remaining).toBe(400); // 2200 - 1800
  });

  it("clamps the exercise factor to 0..1", () => {
    const e = computeEnergyBalance(consumed, 400, cfg({ energyMode: "adjustTarget", exerciseFactor: 5 }));
    expect(e.factor).toBe(1);
    expect(e.exerciseCredit).toBe(400);
  });

  it("with no exercise the net equals the consumed calories", () => {
    const e = computeEnergyBalance(consumed, 0, cfg());
    expect(e.net).toBe(1800);
    expect(e.burned).toBe(0);
  });
});
