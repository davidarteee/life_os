"use client";

import Link from "next/link";
import { CloudOff } from "lucide-react";
import { useT } from "@/hooks/use-t";

export default function OfflinePage() {
  const { t } = useT();
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CloudOff className="size-8" />
        </div>
        <h1 className="font-heading text-xl font-semibold">{t("offline.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("offline.desc")}</p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("offline.goDashboard")}
        </Link>
      </div>
    </div>
  );
}
