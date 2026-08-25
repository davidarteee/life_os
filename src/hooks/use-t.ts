"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import { translate, type DictKey } from "@/lib/i18n";

/** Translation hook bound to the active locale. `t("key", { n: 3 })`. */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );
  return { t, locale };
}
