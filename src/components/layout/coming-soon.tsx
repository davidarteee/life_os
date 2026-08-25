"use client";

import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/hooks/use-t";
import type { DictKey } from "@/lib/i18n";

/**
 * Shared placeholder for roadmap modules. It is intentionally, clearly labeled
 * as not-yet-built (per the "no fake functionality" rule) while still living
 * inside the real shell and design system.
 */
export function ComingSoon({ titleKey, icon: Icon, points }: { titleKey: DictKey; icon: LucideIcon; points?: string[] }) {
  const { t } = useT();
  return (
    <PageContainer>
      <PageHeader title={t(titleKey)} icon={<Icon className="size-5" />} />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Construction className="size-7" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">{t("comingSoon.title")}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t("comingSoon.desc")}</p>
          </div>
          {points && points.length > 0 && (
            <ul className="mt-2 grid gap-1.5 text-left text-sm text-muted-foreground">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary/60" /> {p}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
