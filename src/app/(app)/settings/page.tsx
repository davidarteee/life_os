"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Globe, Coins, Palette, Gamepad2, Download, Plug, Save } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useSession } from "@/components/providers/session-provider";
import { useSettings } from "@/hooks/use-game";
import { useLocaleStore } from "@/stores/locale-store";
import { updateSettings } from "@/lib/data/settings";
import { exportUserJSON, exportHabitsCSV, downloadFile } from "@/lib/data/export";
import { LOCALES } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/config/env";
import type { GameConfig, Locale } from "@/lib/types";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"];

export default function SettingsPage() {
  const { t } = useT();
  const { user, isLocalMode } = useSession();
  const settings = useSettings();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { theme, setTheme } = useTheme();
  const [game, setGame] = useState<GameConfig | null>(null);

  useEffect(() => {
    if (settings) setGame(settings.game);
  }, [settings]);

  if (!user || !settings || !game) return <PageContainer><div className="h-40" /></PageContainer>;

  async function patch(p: Parameters<typeof updateSettings>[1]) {
    if (!user) return;
    await updateSettings(user.id, p);
  }

  async function saveGame() {
    if (!game) return;
    await patch({ game });
    toast.success(t("settings.saved"));
  }

  const num = (path: (g: GameConfig) => number, set: (g: GameConfig, v: number) => GameConfig, label: string) => (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={path(game)}
        onChange={(e) => setGame((g) => (g ? set(structuredClone(g), Number(e.target.value)) : g))}
      />
    </div>
  );

  return (
    <PageContainer>
      <PageHeader title={t("nav.settings")} icon={<SettingsIcon className="size-5" />} />

      <div className="flex flex-col gap-6">
        {/* Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.name")}</span><span>{user.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.email")}</span><span>{user.email ?? "—"}</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("settings.mode")}</span>
              <Badge variant="outline">{isLocalMode ? t("offline.localMode") : t("settings.cloudAccount")}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Language & currency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Globe className="size-4" /> {t("settings.langRegion")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Globe className="size-3" /> {t("settings.language")}</Label>
              <Select
                value={settings.locale}
                onValueChange={(v) => { setLocale(v as Locale); patch({ locale: v as Locale }); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Coins className="size-3" /> {t("settings.currency")}</Label>
              <Select value={settings.currency} onValueChange={(v) => patch({ currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Palette className="size-4" /> {t("settings.appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("settings.theme")}</Label>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((th) => (
                  <Button key={th} variant={theme === th ? "default" : "outline"} size="sm" onClick={() => setTheme(th)}>
                    {th === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("settings.heroImage")}</Label>
              <div className="flex gap-2">
                {(["auto", "custom"] as const).map((m) => (
                  <Button key={m} variant={settings.heroMode === m ? "default" : "outline"} size="sm" onClick={() => patch({ heroMode: m })}>
                    {m === "auto" ? t("settings.heroAuto") : t("settings.heroCustom")}
                  </Button>
                ))}
              </div>
              {settings.heroMode === "custom" && (
                <Input
                  placeholder="https://…/mountain.jpg"
                  defaultValue={settings.heroImageUrl ?? ""}
                  onBlur={(e) => patch({ heroImageUrl: e.target.value })}
                  className="mt-1"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gamification */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Gamepad2 className="size-4" /> {t("settings.gamification")}</CardTitle>
            <Button size="sm" onClick={saveGame} className="gap-1.5"><Save className="size-4" /> {t("common.save")}</Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("settings.xpRewards")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {num((g) => g.xp.habitComplete, (g, v) => ({ ...g, xp: { ...g.xp, habitComplete: v } }), t("settings.habitComplete"))}
                {num((g) => g.xp.allHabitsBonus, (g, v) => ({ ...g, xp: { ...g.xp, allHabitsBonus: v } }), t("settings.allHabitsBonus"))}
                {num((g) => g.xp.nutritionTarget, (g, v) => ({ ...g, xp: { ...g.xp, nutritionTarget: v } }), t("settings.nutritionTarget"))}
                {num((g) => g.xp.taskLow, (g, v) => ({ ...g, xp: { ...g.xp, taskLow: v } }), t("settings.taskLow"))}
                {num((g) => g.xp.taskMedium, (g, v) => ({ ...g, xp: { ...g.xp, taskMedium: v } }), t("settings.taskMedium"))}
                {num((g) => g.xp.taskHigh, (g, v) => ({ ...g, xp: { ...g.xp, taskHigh: v } }), t("settings.taskHigh"))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("settings.livesSection")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {num((g) => g.lives.maxLives, (g, v) => ({ ...g, lives: { ...g.lives, maxLives: v } }), t("settings.maxLives"))}
                {num((g) => g.lives.missThreshold, (g, v) => ({ ...g, lives: { ...g.lives, missThreshold: v } }), t("settings.missThreshold"))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("settings.shopPrices")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {num((g) => g.shop.extra_life, (g, v) => ({ ...g, shop: { ...g.shop, extra_life: v } }), t("shop.extraLife"))}
                {num((g) => g.shop.free_day, (g, v) => ({ ...g, shop: { ...g.shop, free_day: v } }), t("shop.freeDay"))}
                {num((g) => g.shop.streak_shield, (g, v) => ({ ...g, shop: { ...g.shop, streak_shield: v } }), t("shop.streakShield"))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data export */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Download className="size-4" /> {t("settings.yourData")}</CardTitle>
            <CardDescription>{t("settings.yourDataDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={async () => downloadFile(`lifeos-export-${Date.now()}.json`, await exportUserJSON(user.id))}>
              {t("settings.exportJson")}
            </Button>
            <Button variant="outline" size="sm" onClick={async () => downloadFile(`lifeos-habits-${Date.now()}.csv`, await exportHabitsCSV(user.id), "text/csv")}>
              {t("settings.exportCsv")}
            </Button>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Plug className="size-4" /> {t("settings.integrations")}</CardTitle>
            <CardDescription>{t("settings.integrationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {[
              { name: "Supabase (auth + sync)", ready: isSupabaseConfigured, note: isSupabaseConfigured ? t("settings.connected") : t("settings.addKeys") },
              { name: "Spotify", ready: false, note: t("settings.roadmapOauth") },
              { name: "Strava / Suunto", ready: false, note: t("settings.roadmapImport") },
              { name: "Apple Calendar", ready: false, note: t("settings.roadmapIcs") },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <span>{i.name}</span>
                <Badge variant={i.ready ? "default" : "outline"} className={i.ready ? "" : "text-muted-foreground"}>{i.note}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
