"use client";

import { useRef, useState } from "react";
import { ImagePlus, LinkIcon, ShieldCheck, Send, Trophy, X } from "lucide-react";
import type { Challenge } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { useGameConfig } from "@/hooks/use-game";
import { addChallengeEvidence, submitChallenge, verifyChallenge, updateChallenge } from "@/lib/data/game";
import { compressImage } from "@/lib/image";
import { describeChallenge } from "@/lib/i18n/content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

export function ChallengePanel({ challenge }: { challenge: Challenge }) {
  const { user } = useSession();
  const config = useGameConfig();
  const { t, locale } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkValue, setLinkValue] = useState("");
  const [notes, setNotes] = useState(challenge.notes ?? "");
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const uid = user.id;
  const info = describeChallenge(locale, challenge.defId);
  const hasEvidence = challenge.evidence.length > 0 || notes.trim().length > 0;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const value = await compressImage(file);
        await addChallengeEvidence(uid, challenge, { kind: "image", value, filename: file.name });
      }
    } finally {
      setBusy(false);
    }
  }

  async function addLink() {
    const v = linkValue.trim();
    if (!v) return;
    await addChallengeEvidence(uid, challenge, { kind: "link", value: v });
    setLinkValue("");
  }

  async function saveNotes() {
    await updateChallenge(uid, { ...challenge, notes });
  }

  async function onSubmit() {
    await saveNotes();
    await submitChallenge(uid, challenge);
    toast.success(t("challenge.pending"));
  }

  async function onVerify() {
    setBusy(true);
    try {
      await verifyChallenge(uid, { ...challenge, notes }, config);
      toast.success(t("challenge.verified"), { description: "+100 XP" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-life" />
            <h3 className="font-heading text-lg font-semibold">{info.title}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>
        </div>
        <Badge variant={challenge.status === "submitted" ? "secondary" : "outline"} className="shrink-0">
          {challenge.status === "submitted" ? t("challenge.pending") : t(`challenge.status.${challenge.status}` as const)}
        </Badge>
      </div>

      <p className="text-xs font-medium text-muted-foreground">
        {t("challenge.explainVerify")} · <span className="text-foreground/80">{info.metricLabel}</span>
      </p>

      {/* Evidence gallery */}
      {challenge.evidence.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {challenge.evidence.map((e) =>
            e.kind === "image" ? (
              <div key={e.id} className="relative size-20 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.value} alt={e.filename ?? "evidence"} className="size-full object-cover" />
              </div>
            ) : (
              <a
                key={e.id}
                href={e.kind === "link" ? e.value : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-primary hover:underline"
              >
                <LinkIcon className="size-3" /> {e.value.slice(0, 32)}
              </a>
            ),
          )}
        </div>
      )}

      {challenge.status !== "verified" && (
        <>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()} className="gap-1.5">
              <ImagePlus className="size-4" /> {t("challenge.uploadImage")}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://strava.com/activities/…"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
            />
            <Button variant="outline" size="sm" onClick={addLink}>{t("challenge.addLink")}</Button>
          </div>
          <Textarea
            placeholder={t("challenge.note")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={2}
          />

          <div className="flex flex-wrap gap-2">
            {challenge.status === "active" && (
              <Button onClick={onSubmit} disabled={!hasEvidence} className="gap-1.5">
                <Send className="size-4" /> {t("challenge.submit")}
              </Button>
            )}
            <Button onClick={onVerify} variant="default" disabled={busy || !hasEvidence} className="gap-1.5 bg-health text-white hover:bg-health/90">
              <ShieldCheck className="size-4" /> {t("challenge.verify")}
            </Button>
          </div>
        </>
      )}

      {challenge.status === "verified" && (
        <div className="flex items-center gap-2 rounded-lg border border-health/30 bg-health/10 px-3 py-2 text-sm text-health">
          <ShieldCheck className="size-4" /> {t("challenge.verified")}
        </div>
      )}
    </div>
  );
}

export function DismissX({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="close">
      <X className="size-4" />
    </button>
  );
}
