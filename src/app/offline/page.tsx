import Link from "next/link";
import { CloudOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CloudOff className="size-8" />
        </div>
        <h1 className="font-heading text-xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground">
          LifeOS works offline — your habits, tasks and notes are stored on this device. This
          particular page hasn&apos;t been cached yet. Reconnect, or head back to your dashboard.
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
