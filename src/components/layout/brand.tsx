import Link from "next/link";
import { appMeta } from "@/config/env";

/** LifeOS wordmark + glyph. */
export function Brand({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-goals shadow-lg shadow-primary/20">
        <svg viewBox="0 0 24 24" className="size-4.5 text-white" fill="none" aria-hidden>
          <path d="M4 17 C7 11, 11 11, 14 8 S 19 4, 20 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="20" cy="4" r="1.9" fill="currentColor" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight font-heading">{appMeta.name}</span>
    </Link>
  );
}
