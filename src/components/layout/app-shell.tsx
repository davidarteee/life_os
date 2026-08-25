"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ChallengeWatcher } from "@/components/game/challenge-watcher";
import { Brand } from "@/components/layout/brand";

/** Full-screen splash while the session resolves. */
function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex animate-pulse flex-col items-center gap-3">
        <Brand />
        <p className="text-sm text-muted-foreground">Loading your world…</p>
      </div>
    </div>
  );
}

/**
 * Authenticated application frame. Enforces the route guard (cloud mode only),
 * renders the sidebar + header + main scroll area, and mounts the global
 * challenge watcher that triggers the roulette when lives hit zero.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { status, cloudEnabled } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (cloudEnabled && status === "signedout") router.replace("/login");
  }, [cloudEnabled, status, router]);

  if (status === "loading") return <Splash />;
  if (cloudEnabled && status === "signedout") return <Splash />;

  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
      <MobileNav />
      <ChallengeWatcher />
    </div>
  );
}
