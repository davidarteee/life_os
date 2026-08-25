"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HardDriveDownload } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/hooks/use-t";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { isLocalMode, status, signInWithEmail, signUpWithEmail, signInWithGoogle } = useSession();
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  // Local mode: no cloud accounts. Offer a clear, honest entry point.
  if (isLocalMode) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 py-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <HardDriveDownload className="size-6" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">{t("auth.localTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.localDesc")}</p>
          </div>
          <Button onClick={() => router.push("/dashboard")} className="w-full">{t("auth.enter")}</Button>
          <p className="text-xs text-muted-foreground">{t("auth.setupHint")}</p>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fn = mode === "login" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else if (mode === "signup") toast.success(t("auth.confirmEmail"));
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <Button variant="outline" className="w-full gap-2" onClick={() => signInWithGoogle()}>
          <GoogleIcon /> {t("auth.continueGoogle")}
        </Button>
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
          <Separator className="flex-1" />
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="mt-1 w-full" disabled={loading}>
            {loading ? "…" : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>{t("auth.noAccount")} <Link href="/signup" className="text-primary hover:underline">{t("auth.signUp")}</Link></>
          ) : (
            <>{t("auth.haveAccount")} <Link href="/login" className="text-primary hover:underline">{t("auth.signIn")}</Link></>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
