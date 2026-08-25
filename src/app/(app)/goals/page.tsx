"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Target } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.goals" icon={Target} points={["5-year vision boards", "6-month vision cycles with history", ]} />;
}