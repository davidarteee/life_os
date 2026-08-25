"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { GraduationCap } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.study" icon={GraduationCap} points={["Subjects, exams and assignments", "Pomodoro-driven study sessions", "Total study-time analytics", ]} />;
}