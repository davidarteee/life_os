"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { FolderKanban } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.projects" icon={FolderKanban} points={["Progress, deadlines and status", "Associated tasks, notes and links", ]} />;
}