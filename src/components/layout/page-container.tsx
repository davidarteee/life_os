import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent max-width + padding for every page body. */
export function PageContainer({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 md:px-6 md:py-8", wide ? "max-w-[1600px]" : "max-w-6xl", className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid size-11 place-items-center rounded-2xl border border-border/60 bg-card text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
