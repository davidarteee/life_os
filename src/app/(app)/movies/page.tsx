"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Clapperboard } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.movies" icon={Clapperboard} points={["Watchlist and progress", "Ratings and notes", ]} />;
}