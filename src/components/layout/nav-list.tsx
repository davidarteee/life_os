"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/layout/nav-config";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

interface NavListProps {
  onNavigate?: () => void;
}

/** Shared navigation list, used by the desktop sidebar and the mobile drawer. */
export function NavList({ onNavigate }: NavListProps) {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav className="flex flex-col gap-5 px-3 py-2">
      {NAV.map((section) => (
        <div key={section.labelKey} className="flex flex-col gap-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t(section.labelKey)}
          </p>
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "")} />
                <span className="truncate">{t(item.labelKey)}</span>
                {!item.ready && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/80">
                    soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
