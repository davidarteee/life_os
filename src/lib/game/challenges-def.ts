/**
 * Challenge pool for the roulette that triggers at 0 lives.
 *
 * Per spec these are deliberately hard, physical, and *verifiable in a day* —
 * no vague "be productive" filler. Each carries a metric so the evidence UI can
 * ask for the right proof (a distance, a rep count, a step total).
 */

export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  metricLabel: string;
  /** Relative weight for the roulette (rarer = harder). */
  weight: number;
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "run_10k",
    title: "Run 10 km",
    description: "Complete a single 10 km run today. Upload your GPS activity as proof.",
    metricLabel: "Distance (km)",
    weight: 3,
  },
  {
    id: "run_half",
    title: "Half Marathon",
    description: "Run 21.1 km in one session. Strava/Suunto screenshot required.",
    metricLabel: "Distance (km)",
    weight: 1,
  },
  {
    id: "pushups_200",
    title: "200 Push-ups",
    description: "Complete 200 push-ups across the day. Log your sets and add a photo.",
    metricLabel: "Total reps",
    weight: 3,
  },
  {
    id: "steps_25k",
    title: "25,000 Steps",
    description: "Hit 25,000 steps today. Screenshot your step counter at the end of the day.",
    metricLabel: "Steps",
    weight: 3,
  },
  {
    id: "cycle_40k",
    title: "Cycle 40 km",
    description: "Ride 40 km today. Upload the recorded activity.",
    metricLabel: "Distance (km)",
    weight: 2,
  },
  {
    id: "hike_1000d",
    title: "1000 m Ascent Hike",
    description: "Hike a route with at least 1000 m of positive elevation. GPS track required.",
    metricLabel: "Elevation gain (m)",
    weight: 1,
  },
  {
    id: "burpees_100",
    title: "100 Burpees for Time",
    description: "100 burpees as fast as possible. Record it or log your time with a photo.",
    metricLabel: "Time (mm:ss)",
    weight: 3,
  },
  {
    id: "swim_2k",
    title: "Swim 2 km",
    description: "Swim 2 km in one session. Upload your pool/open-water log.",
    metricLabel: "Distance (m)",
    weight: 2,
  },
  {
    id: "plank_10",
    title: "10-Minute Plank Total",
    description: "Accumulate 10 minutes of plank across sets today. Log each hold.",
    metricLabel: "Total time (min)",
    weight: 3,
  },
];

export const CHALLENGES_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));

/** Weighted random pick, used to decide the roulette's true outcome. */
export function pickWeightedChallenge(rand: number = Math.random()): ChallengeDef {
  const total = CHALLENGES.reduce((s, c) => s + c.weight, 0);
  let t = rand * total;
  for (const c of CHALLENGES) {
    t -= c.weight;
    if (t <= 0) return c;
  }
  return CHALLENGES[0];
}
