"use client";

import { PanelLeftClose } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { NavList } from "@/components/layout/nav-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

/**
 * Desktop sidebar. Per spec it fully collapses (disappears) rather than
 * shrinking to an icon rail — a floating opener in the top bar brings it back.
 */
export function AppSidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out overflow-hidden",
        collapsed ? "w-0" : "w-[264px]",
      )}
      aria-hidden={collapsed}
    >
      <div className="flex h-16 items-center justify-between px-5">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={toggle}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <NavList />
        <div className="h-6" />
      </ScrollArea>
    </aside>
  );
}
