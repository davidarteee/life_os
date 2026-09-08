import Link from "next/link";
import { appMeta } from "@/config/env";

/** LifeOS wordmark + glyph. */
export function Brand({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-b from-[#141a26] to-[#070910] shadow-lg shadow-black/40 ring-1 ring-white/10">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden style={{ filter: "drop-shadow(0 0 2.5px rgba(226,232,255,0.65))" }}>
          <path
            d="M12 1.5 C12.9 7.5 16.5 11.1 22.5 12 C16.5 12.9 12.9 16.5 12 22.5 C11.1 16.5 7.5 12.9 1.5 12 C7.5 11.1 11.1 7.5 12 1.5 Z"
            fill="#eef2ff"
          />
          <circle cx="12" cy="12" r="2.15" fill="#070910" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight font-heading">{appMeta.name}</span>
    </Link>
  );
}
