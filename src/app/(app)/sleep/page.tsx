"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Moon } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.sleep" icon={Moon} points={["Hours, quality and trends", "8-hour target and streaks", ]} />;
}