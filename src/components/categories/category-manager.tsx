"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useCategories } from "@/hooks/use-categories";
import { createCategory, updateCategory, deleteCategory, CATEGORY_COLORS } from "@/lib/data/categories";
import { resolveIcon, ICON_NAMES } from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

/** Add / edit / delete the shared categories (name, color, icon). */
export function CategoryManager({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useT();
  const { user } = useSession();
  const categories = useCategories();
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(ICON_NAMES[0]);

  useEffect(() => {
    if (editing === "new") { setName(""); setColor(CATEGORY_COLORS[0]); setIcon("Star"); }
    else if (editing) { setName(editing.name); setColor(editing.color); setIcon(editing.icon); }
  }, [editing]);

  if (!user) return null;
  const uid = user.id;

  async function save() {
    if (!name.trim()) return;
    if (editing === "new") { await createCategory(uid, { name, color, icon }); toast.success(t("cat.created")); }
    else if (editing) { await updateCategory(uid, { ...editing, name: name.trim(), color, icon }); toast.success(t("cat.updated")); }
    setEditing(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setEditing(null); onOpenChange(v); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cat.manage")}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cat-name">{t("cat.name")}</Label>
              <Input id="cat-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } }} />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("common.color")}</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} aria-label={c}
                    className={cn("grid size-7 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-background transition", color === c ? "ring-foreground/60" : "ring-transparent")}
                    style={{ background: c }}>
                    {color === c && <Check className="size-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>{t("common.icon")}</Label>
              <div className="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto">
                {ICON_NAMES.map((n) => {
                  const I = resolveIcon(n);
                  const active = icon === n;
                  return (
                    <button key={n} onClick={() => setIcon(n)} aria-label={n}
                      className={cn("grid aspect-square place-items-center rounded-lg border transition-colors", active ? "border-transparent text-white" : "border-border/60 text-muted-foreground hover:bg-muted")}
                      style={active ? { background: color } : undefined}>
                      <I className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
              <Button onClick={save}>{t("common.save")}</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ul className="flex flex-col gap-1">
              {categories.map((c) => {
                const I = resolveIcon(c.icon);
                return (
                  <li key={c.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklch, ${c.color} 18%, transparent)`, color: c.color }}>
                      <I className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                    <button onClick={() => setEditing(c)} aria-label={t("common.edit")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={async () => { if (window.confirm(t("cat.deleteConfirm"))) { await deleteCategory(uid, c.id); toast.success(t("cat.deleted")); } }}
                      aria-label={t("common.delete")} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button variant="outline" size="sm" onClick={() => setEditing("new")} className="gap-1.5">
              <Plus className="size-4" /> {t("cat.new")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
