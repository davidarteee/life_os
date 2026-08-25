"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Cloud, CloudOff, HardDriveDownload, RefreshCw } from "lucide-react";
import { useSession, useUserId } from "@/components/providers/session-provider";
import { db } from "@/lib/db/dexie";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Compact connectivity/sync badge for the top bar. */
export function SyncStatus() {
  const { isLocalMode } = useSession();
  const uid = useUserId();
  const { t } = useT();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const pending = useLiveQuery(async () => (uid ? db().mutations.where("user_id").equals(uid).count() : 0), [uid]) ?? 0;

  let icon = <Cloud className="size-3.5" />;
  let label = t("offline.synced");
  let tone = "text-health";

  if (isLocalMode) {
    icon = <HardDriveDownload className="size-3.5" />;
    label = t("offline.localMode");
    tone = "text-muted-foreground";
  } else if (!online) {
    icon = <CloudOff className="size-3.5" />;
    label = t("offline.offline");
    tone = "text-warning";
  } else if (pending > 0) {
    icon = <RefreshCw className="size-3.5" />;
    label = t("offline.pending", { n: pending });
    tone = "text-info";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-medium",
            tone,
          )}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isLocalMode ? t("offline.localModeDesc") : `${label}`}
      </TooltipContent>
    </Tooltip>
  );
}
