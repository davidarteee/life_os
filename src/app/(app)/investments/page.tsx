"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { LineChart } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.investments" icon={LineChart} points={["Transactions and portfolio value", "Near-real-time market prices", "Manual + CSV import fallbacks", ]} />;
}