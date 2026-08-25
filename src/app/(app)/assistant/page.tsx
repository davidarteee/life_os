"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Sparkles } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.assistant" icon={Sparkles} points={["Ask questions about all your LifeOS data", "Weekly summaries and recommendations", "Learning-plan generation", ]} />;
}