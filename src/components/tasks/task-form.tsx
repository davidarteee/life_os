"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { createTask, updateTask, deleteTask } from "@/lib/data/tasks";
import { resolveCategoryId, defaultCategoryId } from "@/lib/data/categories";
import { CategoryPicker } from "@/components/categories/category-picker";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task;
  /** Default scheduled day for new tasks (e.g. when adding from a calendar day). */
  defaultDate?: string;
}

export function TaskForm({ open, onOpenChange, task, defaultDate }: TaskFormProps) {
  const { user } = useSession();
  const { t } = useT();
  const editing = !!task;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Re-sync to the task being edited when the dialog opens (reused instance).
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setCategoryId(user ? (task ? resolveCategoryId(user.id, task.categoryId) : defaultCategoryId(user.id)) : "");
    setDate(task?.date ?? defaultDate ?? "");
    setDueDate(task?.dueDate ?? "");
  }, [open, task, defaultDate, user]);

  if (!user) return null;
  const uid = user.id;

  async function onSave() {
    if (!title.trim()) return;
    if (editing && task) {
      await updateTask(uid, {
        ...task,
        title: title.trim(),
        notes: notes.trim() || undefined,
        categoryId,
        date: date || undefined,
        dueDate: dueDate || undefined,
      });
    } else {
      await createTask(uid, {
        title,
        notes: notes || undefined,
        categoryId,
        date: date || undefined,
        dueDate: dueDate || undefined,
      });
    }
    toast.success(editing ? t("tasks.updated") : t("tasks.created"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("tasks.edit") : t("tasks.new")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">{t("tasks.titleField")}</Label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("tasks.namePlaceholder")}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); } }}
            />
          </div>

          <CategoryPicker value={categoryId} onChange={setCategoryId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-date">{t("tasks.date")}</Label>
              <Input id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-due">{t("tasks.deadline")}</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-notes">{t("tasks.notes")}</Label>
            <Textarea id="task-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={async () => { if (task) { await deleteTask(uid, task.id); toast.success(t("tasks.deleted")); onOpenChange(false); } }}
            >
              <Trash2 className="size-4" /> {t("common.delete")}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button onClick={onSave}>{t("common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
