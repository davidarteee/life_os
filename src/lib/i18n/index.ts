import type { Locale } from "@/lib/types";
import { en, type DictKey } from "@/lib/i18n/dictionaries/en";
import { es } from "@/lib/i18n/dictionaries/es";
import { ca } from "@/lib/i18n/dictionaries/ca";

export type { DictKey };

const DICTS: Record<Locale, Partial<Record<DictKey, string>>> = { en, es, ca };

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ca", label: "Català" },
];

/** Translate a key with optional {var} interpolation, falling back to English. */
export function translate(
  locale: Locale,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  const raw = DICTS[locale]?.[key] ?? en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
