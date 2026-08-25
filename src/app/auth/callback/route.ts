import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth / PKCE callback. Exchanges the returned code for a session cookie, then
 * redirects into the app. Surfaces the real reason on failure (as ?error=) so
 * auth problems are diagnosable instead of silent.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const providerError = searchParams.get("error_description") || searchParams.get("error");

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  // The provider (Google/Supabase) returned an error instead of a code.
  if (providerError) return fail(providerError);
  if (!code) return fail("missing_code");

  const supabase = await getSupabaseServer();
  if (!supabase) return fail("cloud_not_configured");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(error.message);

  return NextResponse.redirect(`${origin}${next}`);
}
