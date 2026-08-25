"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Database } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.databases" icon={Database} points={["Notion-style table views", "Filter, sort, search and edit", ]} />;
}