import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/types";

/**
 * Active UI locale. Kept in a persisted store for instant, synchronous access
 * in render (translation can't be async). The Settings page mirrors this into
 * the user's DB settings so the choice is portable across devices.
 */
interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      // Spanish is the default/primary language; users can switch in Settings.
      locale: "es",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "lifeos:locale" },
  ),
);
