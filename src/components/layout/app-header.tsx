"use client";

import { Menu, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/layout/brand";
import { SyncStatus } from "@/components/layout/sync-status";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { GmailQuickAccess } from "@/components/layout/gmail-quick-access";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

/** Slim, sticky top bar above every app page. */
export function AppHeader() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70 bg-background/80 px-3 backdrop-blur-md md:px-5">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9 md:hidden"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop: reopen collapsed sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("hidden size-9", collapsed ? "md:inline-flex" : "md:hidden")}
        onClick={toggleSidebar}
        aria-label="Open sidebar"
      >
        <PanelLeftOpen className="size-4" />
      </Button>

      <div className="md:hidden">
        <Brand />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <GmailQuickAccess />
        <SyncStatus />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
