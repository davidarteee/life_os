"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Plane } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.travel" icon={Plane} points={["Trips, budgets and itineraries", "Checklists and documents", ]} />;
}