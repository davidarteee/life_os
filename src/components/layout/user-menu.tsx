"use client";

import Link from "next/link";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/hooks/use-t";

export function UserMenu() {
  const { user, isLocalMode, signOut } = useSession();
  const { t } = useT();
  const name = user?.name ?? "You";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "Y";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 pl-1.5 pr-2.5">
          <Avatar className="size-6.5">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={name} />}
            <AvatarFallback className="bg-primary/15 text-[11px] text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-sm md:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user?.email ?? (isLocalMode ? t("offline.localMode") : "")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile"><UserIcon className="size-4" /> {t("nav.profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings className="size-4" /> {t("nav.settings")}</Link>
        </DropdownMenuItem>
        {!isLocalMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} variant="destructive">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
