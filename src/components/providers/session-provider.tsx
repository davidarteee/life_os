"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { ensureUserData } from "@/lib/data/bootstrap";
import { getSettings } from "@/lib/data/settings";
import { reconcileLives } from "@/lib/data/game";
import { runSync } from "@/lib/sync/sync-engine";
import { useLocaleStore } from "@/stores/locale-store";
import { LOCAL_USER_ID } from "@/lib/constants";

export { LOCAL_USER_ID };

export interface LifeUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

type Status = "loading" | "authenticated" | "local" | "signedout";

interface SessionValue {
  user: LifeUser | null;
  status: Status;
  isLocalMode: boolean;
  cloudEnabled: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

const LOCAL_USER: LifeUser = { id: LOCAL_USER_ID, email: null, name: "You", avatarUrl: null };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LifeUser | null>(isSupabaseConfigured ? null : LOCAL_USER);
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? "loading" : "local");
  const setLocale = useLocaleStore((s) => s.setLocale);
  const bootstrappedFor = useRef<string | null>(null);

  // Resolve the initial session and subscribe to auth changes (cloud mode only).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();

    function applySession(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) {
      if (!u) {
        setUser(null);
        setStatus("signedout");
        return;
      }
      const meta = u.user_metadata ?? {};
      setUser({
        id: u.id,
        email: u.email ?? null,
        name: (meta.full_name as string) || (meta.name as string) || u.email?.split("@")[0] || "You",
        avatarUrl: (meta.avatar_url as string) || null,
      });
      setStatus("authenticated");
    }
  }, []);

  // Bootstrap data, load locale, reconcile lives and start sync when a user id appears.
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    if (bootstrappedFor.current === uid) return;
    bootstrappedFor.current = uid;

    let cancelled = false;
    (async () => {
      await ensureUserData(uid);
      const settings = await getSettings(uid);
      if (!cancelled) setLocale(settings.locale);
      await reconcileLives(uid, settings.game).catch(() => {});
      await runSync(uid).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, setLocale]);

  // Periodic + connectivity-driven sync (cloud mode only).
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;
    const uid = user.id;
    const tick = () => runSync(uid).catch(() => {});
    const interval = setInterval(tick, 30_000);
    window.addEventListener("online", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", tick);
    };
  }, [user?.id]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      status,
      isLocalMode: !isSupabaseConfigured,
      cloudEnabled: isSupabaseConfigured,
      async signInWithEmail(email, password) {
        const supabase = getSupabaseBrowser();
        if (!supabase) return { error: "Cloud auth is not configured." };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      async signUpWithEmail(email, password) {
        const supabase = getSupabaseBrowser();
        if (!supabase) return { error: "Cloud auth is not configured." };
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },
      async signInWithGoogle() {
        const supabase = getSupabaseBrowser();
        if (!supabase) return { error: "Cloud auth is not configured." };
        // Keep the redirect URL query-free so it matches Supabase's allow-list
        // exactly; the callback route defaults to /dashboard.
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
        return { error: error?.message ?? null };
      },
      async signOut() {
        const supabase = getSupabaseBrowser();
        await supabase?.auth.signOut();
        setUser(null);
        setStatus("signedout");
      },
    }),
    [user, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

/** Convenience: the current user id, or null while loading/signed out. */
export function useUserId(): string | null {
  return useSession().user?.id ?? null;
}
