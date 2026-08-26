"use client";

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, EyeOff, Minus, Plus } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { WIDGET_META, DEFAULT_WIDGET_ORDER, type WidgetId } from "@/lib/dashboard/widgets";
import { WidgetContent } from "@/components/dashboard/widget-registry";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

function SortableWidget({ id }: { id: WidgetId }) {
  const editing = useDashboardStore((s) => s.editing);
  const spans = useDashboardStore((s) => s.spans);
  const setSpan = useDashboardStore((s) => s.setSpan);
  const hide = useDashboardStore((s) => s.hide);
  const { t } = useT();
  const meta = WIDGET_META.get(id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editing });

  if (!meta) return null;
  const span = spans[id] ?? meta.span;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, gridColumn: `span ${span}` }}
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 transition-shadow",
        isDragging && "z-20 opacity-80 shadow-xl",
        editing && "ring-1 ring-primary/30",
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{t(`widget.${id}` as const)}</p>
        {editing && (
          <div className="ml-auto flex items-center gap-1">
            {meta.resizable && (
              <>
                <Button size="icon" variant="ghost" className="size-6" onClick={() => setSpan(id, span - 1)} aria-label={t("widgets.shrink")}>
                  <Minus className="size-3" />
                </Button>
                <span className="w-4 text-center text-[10px] tabular-nums text-muted-foreground">{span}</span>
                <Button size="icon" variant="ghost" className="size-6" onClick={() => setSpan(id, span + 1)} aria-label={t("widgets.widen")}>
                  <Plus className="size-3" />
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" className="size-6 text-muted-foreground" onClick={() => hide(id)} aria-label={t("widgets.hide")}>
              <EyeOff className="size-3.5" />
            </Button>
            <button className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing" {...attributes} {...listeners} aria-label={t("widgets.drag")}>
              <GripVertical className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className={cn(editing && "pointer-events-none select-none")}>
        <WidgetContent id={id} />
      </div>
    </div>
  );
}

/** The responsive 12-column dashboard grid with drag-to-reorder in edit mode. */
export function DashboardGrid() {
  const order = useDashboardStore((s) => s.order);
  const hidden = useDashboardStore((s) => s.hidden);
  const reorder = useDashboardStore((s) => s.reorder);

  // Self-heal: append any newly-added default widgets missing from a saved
  // layout, so new modules (e.g. Tasks/Calendar) appear without a reset.
  const fullOrder = [...order, ...DEFAULT_WIDGET_ORDER.filter((id) => !order.includes(id))];
  const visible = fullOrder.filter((id) => id !== "hero-stats" && !hidden.includes(id));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fullOrder.indexOf(active.id as WidgetId);
    const to = fullOrder.indexOf(over.id as WidgetId);
    if (from < 0 || to < 0) return;
    reorder(arrayMove(fullOrder, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visible} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {visible.map((id) => <SortableWidget key={id} id={id} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
