"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Dumbbell } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.workouts" icon={Dumbbell} points={["Exercises, sets, reps and weight", "Progress tracking over time", ]} />;
}