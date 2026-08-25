"use client";

import { Settings2, Check, RotateCcw, Eye } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { HeroHeader } from "@/components/dashboard/hero-header";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useT } from "@/hooks/use-t";

export default function DashboardPage() {
  const { t } = useT();
  const editing = useDashboardStore((s) => s.editing);
  const setEditing = useDashboardStore((s) => s.setEditing);
  const hidden = useDashboardStore((s) => s.hidden);
  const show = useDashboardStore((s) => s.show);
  const reset = useDashboardStore((s) => s.reset);

  return (
    <PageContainer wide>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="sr-only">{t("dashboard.title")}</h1>
          <div className="ml-auto flex items-center gap-2">
            {editing && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="size-4" /> {t("dashboard.hidden")} {hidden.length > 0 && `(${hidden.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("dashboard.hidden")}</DropdownMenuLabel>
                    {hidden.length === 0 ? (
                      <DropdownMenuItem disabled>{t("common.none")}</DropdownMenuItem>
                    ) : (
                      hidden.map((id) => (
                        <DropdownMenuItem key={id} onClick={() => show(id)}>
                          {t(`widget.${id}` as const)}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={reset}>
                  <RotateCcw className="size-4" /> {t("dashboard.resetLayout")}
                </Button>
              </>
            )}
            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <><Check className="size-4" /> {t("dashboard.done")}</> : <><Settings2 className="size-4" /> {t("dashboard.customize")}</>}
            </Button>
          </div>
        </div>

        <HeroHeader />
        <DashboardGrid />
      </div>
    </PageContainer>
  );
}
