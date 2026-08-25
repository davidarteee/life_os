import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/config/env";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Returns null when Supabase isn't configured, which
 * is a first-class state in LifeOS: the app runs fully offline against
 * IndexedDB and only lights up cloud auth + sync once keys are present.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!_client) {
    _client = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return _client;
}
