import type { TaskPriority } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

/** Visual + i18n metadata per task priority. Written as full class literals. */
export const PRIORITY: Record<TaskPriority, { labelKey: DictKey; dot: string; text: string; rank: number }> = {
  high: { labelKey: "tasks.priority.high", dot: "bg-destructive", text: "text-destructive", rank: 0 },
  medium: { labelKey: "tasks.priority.medium", dot: "bg-warning", text: "text-warning", rank: 1 },
  low: { labelKey: "tasks.priority.low", dot: "bg-muted-foreground", text: "text-muted-foreground", rank: 2 },
};

export const PRIORITY_ORDER: TaskPriority[] = ["high", "medium", "low"];
