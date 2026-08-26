import type { AchievementDef, AchievementRarity } from "@/lib/types";

/**
 * Static achievement catalog. Definitions live in code (versioned, no DB round
 * trip); only per-user unlock state is stored. The engine matches these ids
 * against live counters to award progress.
 *
 * `metric` is the counter an achievement tracks. The engine knows how to
 * compute each metric from the user's data; adding a new milestone is just a
 * new row here.
 */

export type AchievementMetric =
  | "habitsCompleted" // lifetime completed habit-days
  | "habitStreak" // best current streak across habits
  | "perfectDays" // days where all required habits done
  | "tasksCompleted" // lifetime completed tasks
  | "level"
  | "challengesVerified"
  | "xpTotal"
  | "freeDaysUsed";

export interface AchievementDefEx extends AchievementDef {
  metric: AchievementMetric;
}

function rarityForIndex(i: number, total: number): AchievementRarity {
  const t = i / Math.max(1, total - 1);
  if (t >= 0.85) return "legendary";
  if (t >= 0.6) return "epic";
  if (t >= 0.3) return "rare";
  return "common";
}

function xpForRarity(r: AchievementRarity): number {
  return { common: 25, rare: 75, epic: 200, legendary: 500 }[r];
}

/** Build a family of milestone achievements sharing a metric. */
function milestones(opts: {
  prefix: string;
  category: AchievementDef["category"];
  icon: string;
  metric: AchievementMetric;
  label: (n: number) => { title: string; description: string };
  steps: number[];
}): AchievementDefEx[] {
  return opts.steps.map((goal, i) => {
    const rarity = rarityForIndex(i, opts.steps.length);
    const { title, description } = opts.label(goal);
    return {
      id: `${opts.prefix}_${goal}`,
      category: opts.category,
      metric: opts.metric,
      icon: opts.icon,
      title,
      description,
      rarity,
      xpReward: xpForRarity(rarity),
      hidden: false,
      goal,
    };
  });
}

export const ACHIEVEMENTS: AchievementDefEx[] = [
  ...milestones({
    prefix: "habits_done",
    category: "health",
    icon: "CircleCheckBig",
    metric: "habitsCompleted",
    steps: [1, 10, 50, 100, 500, 1000],
    label: (n) => ({
      title: n === 1 ? "First Step" : `${n} Habits Done`,
      description: `Complete ${n} habit${n > 1 ? "s" : ""} in total.`,
    }),
  }),
  ...milestones({
    prefix: "habit_streak",
    category: "health",
    icon: "Flame",
    metric: "habitStreak",
    steps: [7, 30, 100, 365],
    label: (n) => ({
      title: `${n}-Day Streak`,
      description: `Keep any habit alive for ${n} days straight.`,
    }),
  }),
  ...milestones({
    prefix: "tasks_done",
    category: "productivity",
    icon: "ListChecks",
    metric: "tasksCompleted",
    steps: [10, 100, 500, 1000],
    label: (n) => ({
      title: `${n} Tasks Done`,
      description: `Complete ${n} tasks in total.`,
    }),
  }),
  ...milestones({
    prefix: "perfect_days",
    category: "gamification",
    icon: "Sparkles",
    metric: "perfectDays",
    steps: [1, 7, 30, 100],
    label: (n) => ({
      title: n === 1 ? "Perfect Day" : `${n} Perfect Days`,
      description: `Complete every required habit on ${n} day${n > 1 ? "s" : ""}.`,
    }),
  }),
  ...milestones({
    prefix: "level",
    category: "gamification",
    icon: "TrendingUp",
    metric: "level",
    steps: [5, 10, 25, 50, 100],
    label: (n) => ({
      title: `Level ${n}`,
      description: `Reach level ${n}.`,
    }),
  }),
  ...milestones({
    prefix: "xp",
    category: "gamification",
    icon: "Zap",
    metric: "xpTotal",
    steps: [1000, 10000, 50000],
    label: (n) => ({
      title: `${n.toLocaleString()} XP`,
      description: `Earn ${n.toLocaleString()} lifetime XP.`,
    }),
  }),
  ...milestones({
    prefix: "challenge",
    category: "gamification",
    icon: "Trophy",
    metric: "challengesVerified",
    steps: [1, 5, 25],
    label: (n) => ({
      title: n === 1 ? "Redemption" : `${n} Challenges`,
      description: `Verify ${n} comeback challenge${n > 1 ? "s" : ""} after losing all lives.`,
    }),
  }),
  // Hidden achievements — invisible until unlocked.
  {
    id: "hidden_phoenix",
    category: "meta",
    metric: "challengesVerified",
    icon: "Bird",
    title: "Phoenix",
    description: "Rise from zero lives and verify the challenge the same day.",
    rarity: "epic",
    xpReward: 250,
    hidden: true,
    goal: 1,
  },
  {
    id: "hidden_ironwill",
    category: "meta",
    metric: "perfectDays",
    icon: "ShieldCheck",
    title: "Iron Will",
    description: "A hidden reward for relentless consistency.",
    rarity: "legendary",
    xpReward: 600,
    hidden: true,
    goal: 60,
  },
];

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
