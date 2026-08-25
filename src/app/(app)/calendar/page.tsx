"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { CalendarDays } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.calendar" icon={CalendarDays} points={["Monthly master calendar", "Tasks, exams, projects and free days", "Apple Calendar sync (roadmap)", ]} />;
}