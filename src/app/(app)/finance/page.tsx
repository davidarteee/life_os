"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Wallet } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.finance" icon={Wallet} points={["Income, expenses and budgets", "Categories and subscriptions", ]} />;
}