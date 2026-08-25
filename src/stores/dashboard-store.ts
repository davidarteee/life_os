import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_WIDGET_ORDER, WIDGET_META, type WidgetId } from "@/lib/dashboard/widgets";

/**
 * Per-user dashboard layout: widget order, hidden set, and per-widget span
 * overrides. Persisted locally (and portable — a future migration can sync this
 * to user_settings). The store is the single source of truth the grid renders.
 */
interface DashboardState {
  order: WidgetId[];
  hidden: WidgetId[];
  spans: Partial<Record<WidgetId, number>>;
  editing: boolean;

  setEditing: (v: boolean) => void;
  reorder: (order: WidgetId[]) => void;
  hide: (id: WidgetId) => void;
  show: (id: WidgetId) => void;
  setSpan: (id: WidgetId, span: number) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      order: [...DEFAULT_WIDGET_ORDER],
      hidden: [],
      spans: {},
      editing: false,

      setEditing: (v) => set({ editing: v }),
      reorder: (order) => set({ order }),
      hide: (id) => set((s) => ({ hidden: [...new Set([...s.hidden, id])] })),
      show: (id) => set((s) => ({ hidden: s.hidden.filter((h) => h !== id) })),
      setSpan: (id, span) =>
        set((s) => {
          const meta = WIDGET_META.get(id);
          if (!meta) return s;
          const clamped = Math.max(meta.minSpan, Math.min(meta.maxSpan, span));
          return { spans: { ...s.spans, [id]: clamped } };
        }),
      reset: () => set({ order: [...DEFAULT_WIDGET_ORDER], hidden: [], spans: {} }),
    }),
    {
      name: "lifeos:dashboard",
      partialize: (s) => ({ order: s.order, hidden: s.hidden, spans: s.spans }),
    },
  ),
);
