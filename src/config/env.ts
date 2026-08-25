/**
 * Centralized, typed access to public environment configuration.
 *
 * LifeOS is offline-first: the app is fully functional against the local
 * IndexedDB store even when Supabase is not configured. Cloud auth + sync only
 * activate when these public vars are present. Never read process.env directly
 * elsewhere — go through this module so "is the cloud available?" has one answer.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  /** App base URL, used for OAuth redirects. Falls back to window origin client-side. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "",
} as const;

/** True only when both Supabase public vars are present and well-formed. */
export const isSupabaseConfigured =
  url.startsWith("http") && anonKey.length > 20;

export const appMeta = {
  name: "LifeOS",
  tagline: "Build your life. Every day.",
  description:
    "A personal operating system for habits, health, finance, goals and growth.",
} as const;
