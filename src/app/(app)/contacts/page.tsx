"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Users } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.contacts" icon={Users} points={["Birthdays on the calendar", "Relationships and notes", ]} />;
}