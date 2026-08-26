"use client";

import { GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { useSession } from "@/components/providers/session-provider";
import { reorderTasks } from "@/lib/data/tasks";
import { TaskItem } from "@/components/tasks/task-item";
import { cn } from "@/lib/utils";

function SortableTask({ task, onEdit, showDate }: { task: Task; onEdit: () => void; showDate: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "z-10 opacity-80")}>
      <TaskItem
        task={task}
        onEdit={onEdit}
        showDate={showDate}
        dragHandle={
          <button
            className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
            aria-label="reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  emptyText: string;
  showDate?: boolean;
  reorderable?: boolean;
}

export function TaskList({ tasks, onEdit, emptyText, showDate = true, reorderable = true }: TaskListProps) {
  const { user } = useSession();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (tasks.length === 0) {
    return <p className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!user || !over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    await reorderTasks(user.id, arrayMove(ids, from, to));
  }

  if (!reorderable) {
    return (
      <div className="flex flex-col gap-2">
        {tasks.map((t) => <TaskItem key={t.id} task={t} onEdit={() => onEdit(t)} showDate={showDate} />)}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => <SortableTask key={t.id} task={t} onEdit={() => onEdit(t)} showDate={showDate} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
