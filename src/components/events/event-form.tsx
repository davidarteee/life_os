"use client";

import { useEffect, useState } from "react";
import { Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import type { Event, EventCategory, RepeatFreq } from "@/lib/types";
import { EVENT_CATEGORIES, REPEAT_FREQS } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { createEvent, updateEvent, deleteEvent } from "@/lib/data/events";
import { EVENT_CATEGORY } from "@/components/events/category";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dayKey } from "@/lib/date";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

interface EventFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: Event;
  defaultDate?: string;
}

export function EventForm({ open, onOpenChange, event, defaultDate }: EventFormProps) {
  const { user } = useSession();
  const { t } = useT();
  const editing = !!event;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("personal");
  const [notes, setNotes] = useState("");
  const [repeatOn, setRepeatOn] = useState(false);
  const [freq, setFreq] = useState<RepeatFreq>("weekly");
  const [interval, setIntervalN] = useState(1);

  // Re-sync to the event being edited whenever the dialog opens (the dialog
  // instance is reused, so useState initializers only run once on mount).
  useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setDate(event?.date ?? defaultDate ?? dayKey());
    setTime(event?.time ?? "");
    setCategory((event?.category as EventCategory) ?? "personal");
    setNotes(event?.notes ?? "");
    setRepeatOn(!!event?.repeat);
    setFreq(event?.repeat?.freq ?? "weekly");
    setIntervalN(event?.repeat?.interval ?? 1);
  }, [open, event, defaultDate]);

  if (!user) return null;
  const uid = user.id;

  async function onSave() {
    if (!title.trim() || !date) return;
    const repeat = repeatOn ? { freq, interval: Math.max(1, Math.floor(interval)) } : undefined;
    const payload = { title: title.trim(), date, time: time || undefined, category, notes: notes.trim() || undefined, repeat };
    if (editing && event) {
      await updateEvent(uid, { ...event, ...payload });
    } else {
      await createEvent(uid, payload);
    }
    toast.success(editing ? t("events.updated") : t("events.created"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("events.edit") : t("events.new")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="event-title">{t("events.titleField")}</Label>
            <Input
              id="event-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("events.namePlaceholder")}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); } }}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>{t("events.category")}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {EVENT_CATEGORIES.map((c) => {
                const meta = EVENT_CATEGORY[c];
                const Icon = meta.icon;
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-colors",
                      active ? "font-medium" : "border-border/60 text-muted-foreground hover:bg-muted",
                    )}
                    style={active ? { borderColor: meta.color, background: `color-mix(in oklch, ${meta.color} 14%, transparent)`, color: meta.color } : undefined}
                  >
                    <Icon className="size-3.5 shrink-0" /> <span className="truncate">{t(meta.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="event-date">{t("events.date")}</Label>
              <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-time">{t("events.time")}</Label>
              <Input id="event-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Recurrence */}
          <div className="rounded-lg border border-border/60 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">{t("events.repeat")}</p>
              </div>
              <Switch checked={repeatOn} onCheckedChange={setRepeatOn} />
            </div>
            {repeatOn && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("events.every")}</span>
                <Input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setIntervalN(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16"
                />
                <Select value={freq} onValueChange={(v) => setFreq(v as RepeatFreq)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPEAT_FREQS.map((f) => (
                      <SelectItem key={f} value={f}>{interval === 1 ? t(`events.freqOne.${f}` as const) : t(`events.freq.${f}` as const)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="event-notes">{t("events.notes")}</Label>
            <Textarea id="event-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={async () => { if (event) { await deleteEvent(uid, event.id); toast.success(t("events.deleted")); onOpenChange(false); } }}
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
