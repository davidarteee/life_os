"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { BookOpen } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.books" icon={BookOpen} points={["Want to read / reading / done", "Progress, ratings and notes", ]} />;
}