"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useUserId } from "@/components/providers/session-provider";
import { listCategories } from "@/lib/data/categories";
import type { Category } from "@/lib/types";

/** Live: the user's categories, ordered. */
export function useCategories(): Category[] {
  const uid = useUserId();
  return useLiveQuery(async () => (uid ? listCategories(uid) : []), [uid]) ?? [];
}

/** Live: a Map of category id → category, for quick colored lookups. */
export function useCategoryMap(): Map<string, Category> {
  const cats = useCategories();
  return useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
}
