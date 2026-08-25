import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  accentClass?: string;
  className?: string;
}

/** Compact metric tile: label, big value, optional icon + hint. */
export function StatTile({ label, value, icon: Icon, hint, accentClass = "text-primary", className }: StatTileProps) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn("size-4", accentClass)} />}
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
