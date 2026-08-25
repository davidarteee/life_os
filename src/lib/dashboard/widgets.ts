/**
 * Dashboard widget catalog. The registry (React components) is keyed by these
 * ids; the per-user layout store references ids only, so layout state stays
 * serializable and portable. `span` is the default column span on the 12-col
 * desktop grid; `minSpan`/`maxSpan` bound user resizing.
 */

export type WidgetId =
  | "hero-stats"
  | "today-habits"
  | "gamification"
  | "lives"
  | "xp-progress"
  | "streaks"
  | "achievements-preview"
  | "quick-note"
  | "pomodoro"
  | "month-overview"
  | "coming-soon-health"
  | "coming-soon-finance";

export interface WidgetMeta {
  id: WidgetId;
  title: string;
  span: number; // 1..12
  minSpan: number;
  maxSpan: number;
  resizable: boolean;
}

export const WIDGETS: WidgetMeta[] = [
  { id: "hero-stats", title: "Overview", span: 12, minSpan: 12, maxSpan: 12, resizable: false },
  { id: "today-habits", title: "Today's habits", span: 5, minSpan: 4, maxSpan: 8, resizable: true },
  { id: "gamification", title: "Life status", span: 4, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "streaks", title: "Streaks", span: 3, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "xp-progress", title: "XP & Level", span: 4, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "lives", title: "Lives", span: 4, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "achievements-preview", title: "Achievements", span: 4, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "quick-note", title: "Quick note", span: 4, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "pomodoro", title: "Pomodoro", span: 4, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "month-overview", title: "This month", span: 6, minSpan: 4, maxSpan: 12, resizable: true },
  { id: "coming-soon-health", title: "Health", span: 3, minSpan: 3, maxSpan: 6, resizable: true },
  { id: "coming-soon-finance", title: "Finance", span: 3, minSpan: 3, maxSpan: 6, resizable: true },
];

export const WIDGET_META = new Map(WIDGETS.map((w) => [w.id, w]));

export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "hero-stats",
  "today-habits",
  "gamification",
  "streaks",
  "xp-progress",
  "lives",
  "achievements-preview",
  "quick-note",
  "pomodoro",
  "month-overview",
  "coming-soon-health",
  "coming-soon-finance",
];
