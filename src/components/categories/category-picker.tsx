"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { CategoryManager } from "@/components/categories/category-manager";
import { resolveIcon } from "@/lib/icons";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Select a shared category, with a gear to add/edit/delete categories. */
export function CategoryPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const { t } = useT();
  const categories = useCategories();
  const [managerOpen, setManagerOpen] = useState(false);

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label>{t("events.category")}</Label>
        <button type="button" onClick={() => setManagerOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Settings2 className="size-3.5" /> {t("cat.manage")}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {categories.map((c) => {
          const I = resolveIcon(c.icon);
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-colors", active ? "font-medium" : "border-border/60 text-muted-foreground hover:bg-muted")}
              style={active ? { borderColor: c.color, background: `color-mix(in oklch, ${c.color} 14%, transparent)`, color: c.color } : undefined}
            >
              <I className="size-3.5 shrink-0" /> <span className="truncate">{c.name}</span>
            </button>
          );
        })}
      </div>
      <CategoryManager open={managerOpen} onOpenChange={setManagerOpen} />
    </div>
  );
}
