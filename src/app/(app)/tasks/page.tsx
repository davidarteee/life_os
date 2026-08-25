"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { ListTodo } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.tasks" icon={ListTodo} points={["List, Kanban and calendar views", "Priorities, subtasks and recurrence", "Plan tasks onto specific days", ]} />;
}