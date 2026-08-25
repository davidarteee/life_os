"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Brand } from "@/components/layout/brand";
import { NavList } from "@/components/layout/nav-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/ui-store";

/** Slide-over navigation drawer for mobile / narrow viewports. */
export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  return (
    <Sheet open={open} onOpenChange={setMobileNav}>
      <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
        <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-5">
          <SheetTitle asChild>
            <div><Brand /></div>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-4rem)]">
          <NavList onNavigate={() => setMobileNav(false)} />
          <div className="h-8" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
