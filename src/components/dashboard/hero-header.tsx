"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useSettings, useGameState, useGameConfig } from "@/hooks/use-game";
import { LivesDisplay } from "@/components/game/lives-display";
import { greetingKey } from "@/lib/date";
import { levelTitle } from "@/lib/game/xp";
import { appMeta } from "@/config/env";
import { useT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";

/**
 * Curated landscape backdrops (Unsplash CDN). Loaded as a CSS background over an
 * always-present aurora gradient, so if the network is down the hero still looks
 * intentional. Users can override with their own image URL in Settings.
 */
const LANDSCAPES = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  "https://images.unsplash.com/photo-1475924156734-496f67dee80f",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5",
];

export function HeroHeader() {
  const { user } = useSession();
  const settings = useSettings();
  const { state, progress } = useGameState();
  const config = useGameConfig();
  const { t } = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [now, setNow] = useState<Date | null>(null);
  const [autoImage, setAutoImage] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Pick a fresh landscape once per mount (kept out of render for purity).
  useEffect(() => {
    const base = LANDSCAPES[Math.floor(Math.random() * LANDSCAPES.length)];
    setAutoImage(`${base}?auto=format&fit=crop&w=1800&q=80`);
  }, []);

  const bg =
    settings?.heroMode === "custom" && settings.heroImageUrl ? settings.heroImageUrl : autoImage;

  const greet = t(`greeting.${greetingKey(now ?? new Date())}` as const);
  const dateStr = now?.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) ?? "";
  const timeStr = now?.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) ?? "";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60">
      <div className="aurora absolute inset-0" />
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: bg ? `url("${bg}")` : undefined, opacity: bg ? 1 : 0 }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

      <div className="relative z-10 flex min-h-[200px] flex-col justify-between gap-6 p-5 md:min-h-[240px] md:flex-row md:items-end md:p-7">
        <div className="max-w-lg">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{appMeta.tagline}</p>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-balance md:text-4xl">
            {greet}{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground md:text-base">{dateStr}</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="font-heading text-3xl font-bold tabular-nums md:text-4xl">{timeStr}</p>
          </div>
          {state && progress && (
            <div className="flex flex-col items-end gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-goals font-heading text-sm font-bold text-white">
                  {progress.level}
                </span>
                <div className="text-left">
                  <p className="text-xs font-medium leading-none">{levelTitle(progress.level)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{progress.xpRemaining} XP to go</p>
                </div>
              </div>
              <LivesDisplay lives={state.lives} max={config.lives.maxLives} size="sm" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
