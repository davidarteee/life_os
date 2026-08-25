"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useT } from "@/hooks/use-t";
import type { DictKey } from "@/lib/i18n";

/**
 * Two quick-launch buttons for the user's Gmail inboxes. Per spec, LifeOS never
 * reads or touches email — these are plain external links that open Gmail's
 * multi-account URLs (u/0, u/1) in a new tab. No Gmail scopes requested.
 */
const ACCOUNTS: { labelKey: DictKey; href: string }[] = [
  { labelKey: "gmail.personal", href: "https://mail.google.com/mail/u/0/" },
  { labelKey: "gmail.university", href: "https://mail.google.com/mail/u/1/" },
];

export function GmailQuickAccess() {
  const { t } = useT();
  return (
    <div className="hidden items-center gap-0.5 sm:flex">
      {ACCOUNTS.map((a, i) => {
        const label = t(a.labelKey);
        return (
          <Tooltip key={a.href}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground" asChild>
                <a href={a.href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Mail className="size-4" />
                  <span className="absolute bottom-1.5 right-1.5 grid size-3 place-items-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
