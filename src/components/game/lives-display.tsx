"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivesDisplayProps {
  lives: number;
  max: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "size-4", md: "size-5", lg: "size-7" };

/** Row of hearts representing remaining lives. */
export function LivesDisplay({ lives, max, size = "md", className }: LivesDisplayProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`${lives} of ${max} lives`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < lives;
        return (
          <Heart
            key={i}
            className={cn(
              SIZES[size],
              "transition-all duration-300",
              filled ? "fill-life text-life drop-shadow-[0_0_6px_color-mix(in_oklch,var(--life)_45%,transparent)]" : "text-muted-foreground/30",
            )}
          />
        );
      })}
    </div>
  );
}
