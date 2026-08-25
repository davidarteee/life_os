/**
 * XP → level math.
 *
 * The XP needed to clear a level grows smoothly so early levels feel fast and
 * later ones feel earned, without ever becoming impossible. Cost to go from
 * level L to L+1 is: BASE * L^EXP, rounded to a tidy step.
 *
 *   L1→L2 ≈ 100 XP,  L4→L5 ≈ 340,  L9→L10 ≈ 900,  L24→L25 ≈ 3100
 *
 * All functions are pure and unit-tested — they are the backbone of the whole
 * progression system, so correctness matters more than cleverness.
 */

const BASE = 100;
const EXP = 1.45;

/** XP required to advance FROM the given level to the next one. */
export function xpToNextLevel(level: number): number {
  const raw = BASE * Math.pow(Math.max(1, level), EXP);
  return Math.round(raw / 10) * 10;
}

/** Cumulative XP required to REACH the given level (level 1 == 0 XP). */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

export interface LevelProgress {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP span of the current level. */
  xpForLevel: number;
  /** Total XP still needed to hit the next level. */
  xpRemaining: number;
  /** 0..1 progress through the current level. */
  ratio: number;
  levelFloor: number;
  levelCeil: number;
}

/** Resolve a lifetime XP total into level + progress within that level. */
export function levelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let floor = 0;
  // Advance while the next threshold is still covered by xp.
  while (xp >= floor + xpToNextLevel(level)) {
    floor += xpToNextLevel(level);
    level += 1;
    if (level > 999) break; // hard safety ceiling
  }
  const span = xpToNextLevel(level);
  const into = xp - floor;
  return {
    level,
    xpIntoLevel: into,
    xpForLevel: span,
    xpRemaining: span - into,
    ratio: span === 0 ? 0 : Math.min(1, into / span),
    levelFloor: floor,
    levelCeil: floor + span,
  };
}

/** Optional flavor titles unlocked by level bands (architecture per spec). */
export function levelTitle(level: number): string {
  if (level >= 100) return "Ascended";
  if (level >= 50) return "Legend";
  if (level >= 30) return "Master";
  if (level >= 20) return "Veteran";
  if (level >= 10) return "Adept";
  if (level >= 5) return "Apprentice";
  return "Novice";
}

/** i18n key for the level title, so the UI can render it in the active locale. */
export function levelTitleKey(level: number): string {
  if (level >= 100) return "title.ascended";
  if (level >= 50) return "title.legend";
  if (level >= 30) return "title.master";
  if (level >= 20) return "title.veteran";
  if (level >= 10) return "title.adept";
  if (level >= 5) return "title.apprentice";
  return "title.novice";
}
