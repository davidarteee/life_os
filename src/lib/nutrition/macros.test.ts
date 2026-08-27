import { describe, it, expect } from "vitest";
import { scaleMacros, macrosForQuantity, sumMacros, progress, emptyMacros } from "@/lib/nutrition/macros";
import type { Macros } from "@/lib/types";

const base: Macros = { calories: 100, protein: 10, carbs: 20, fat: 5 };

describe("macro math", () => {
  it("scales macros by a factor (calories rounded to int, macros to 1 decimal)", () => {
    expect(scaleMacros(base, 1.5)).toEqual({ calories: 150, protein: 15, carbs: 30, fat: 7.5 });
  });

  it("scales a consumed quantity from the reference amount", () => {
    // 150 g of a food defined per 100 g → factor 1.5
    expect(macrosForQuantity(base, 100, 150)).toEqual({ calories: 150, protein: 15, carbs: 30, fat: 7.5 });
  });

  it("returns zero macros when the reference amount is invalid", () => {
    expect(macrosForQuantity(base, 0, 100)).toEqual(emptyMacros());
  });

  it("sums a list of macro rows with stable rounding", () => {
    expect(sumMacros([base, base, { calories: 50, protein: 5, carbs: 0, fat: 2.5 }])).toEqual({
      calories: 250,
      protein: 25,
      carbs: 40,
      fat: 12.5,
    });
  });

  it("sums to empty macros for an empty list", () => {
    expect(sumMacros([])).toEqual(emptyMacros());
  });

  it("computes clamped 0..1 progress toward a target", () => {
    expect(progress(50, 100)).toBe(0.5);
    expect(progress(150, 100)).toBe(1); // clamped
    expect(progress(10, 0)).toBe(0); // no target
  });
});
