import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";
import { appMeta } from "@/config/env";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4">
      <div className="aurora pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Brand href="/login" />
          <p className="text-sm text-muted-foreground">{appMeta.tagline}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
