"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Lightbulb } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.learning" icon={Lightbulb} points={["Topics, subtopics and references", "AI-assisted learning plans", ]} />;
}