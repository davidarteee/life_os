"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Two quick-launch buttons for the user's Gmail inboxes. Per spec, LifeOS never
 * reads or touches email — these are plain external links that open Gmail's
 * multi-account URLs (u/0, u/1) in a new tab. No Gmail scopes requested.
 */
const ACCOUNTS = [
  { label: "Personal mail", href: "https://mail.google.com/mail/u/0/" },
  { label: "University mail", href: "https://mail.google.com/mail/u/1/" },
];

export function GmailQuickAccess() {
  return (
    <div className="hidden items-center gap-0.5 sm:flex">
      {ACCOUNTS.map((a, i) => (
        <Tooltip key={a.href}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground" asChild>
              <a href={a.href} target="_blank" rel="noopener noreferrer" aria-label={a.label}>
                <Mail className="size-4" />
                <span className="absolute bottom-1.5 right-1.5 grid size-3 place-items-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{a.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
