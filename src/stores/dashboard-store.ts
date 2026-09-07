import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_WIDGET_ORDER, WIDGET_META, type WidgetId } from "@/lib/dashboard/widgets";

/**
 * Per-user dashboard layout: widget order, hidden set, and per-widget span
 * overrides. Persisted locally (and portable — a future migration can sync this
 * to user_settings). The store is the single source of truth the grid renders.
 */
/** Vertical sizing bounds (px). `undefined` height means auto (fit content). */
export const HEIGHT_MIN = 160;
export const HEIGHT_MAX = 900;
export const HEIGHT_STEP = 80;
export const HEIGHT_BASE = 280;

interface DashboardState {
  order: WidgetId[];
  hidden: WidgetId[];
  spans: Partial<Record<WidgetId, number>>;
  heights: Partial<Record<WidgetId, number>>;
  editing: boolean;

  setEditing: (v: boolean) => void;
  reorder: (order: WidgetId[]) => void;
  hide: (id: WidgetId) => void;
  show: (id: WidgetId) => void;
  setSpan: (id: WidgetId, span: number) => void;
  /** Nudge a widget's min-height by `delta` px (from its current or the base). */
  bumpHeight: (id: WidgetId, delta: number) => void;
  resetHeight: (id: WidgetId) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      order: [...DEFAULT_WIDGET_ORDER],
      hidden: [],
      spans: {},
      heights: {},
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
      bumpHeight: (id, delta) =>
        set((s) => {
          const current = s.heights[id] ?? HEIGHT_BASE;
          const clamped = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, current + delta));
          return { heights: { ...s.heights, [id]: clamped } };
        }),
      resetHeight: (id) =>
        set((s) => {
          const next = { ...s.heights };
          delete next[id];
          return { heights: next };
        }),
      reset: () => set({ order: [...DEFAULT_WIDGET_ORDER], hidden: [], spans: {}, heights: {} }),
    }),
    {
      name: "lifeos:dashboard",
      partialize: (s) => ({ order: s.order, hidden: s.hidden, spans: s.spans, heights: s.heights }),
    },
  ),
);
