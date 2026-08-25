"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { StickyNote } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.notes" icon={StickyNote} points={["Folders, pages and tags", "Markdown, checklists and images", ]} />;
}