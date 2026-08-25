"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Gift } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.wishlist" icon={Gift} points={["Custom lists with prices and links", "Priorities and categories", ]} />;
}