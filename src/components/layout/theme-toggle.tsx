"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";

/** Light/dark toggle. The system is dark-first; this is here for the future light theme. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme !== "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground"
      aria-label={t("settings.theme")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
