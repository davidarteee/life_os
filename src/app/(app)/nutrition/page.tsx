"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Apple } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.nutrition" icon={Apple} points={["Log meals with macros", "Targets vs consumed charts", "Food database and recipes", ]} />;
}