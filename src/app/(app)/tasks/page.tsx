"use client";

import { useMemo, useState } from "react";
import { ListTodo, Plus, Search, Inbox, CalendarDays, AlertTriangle, CheckCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { StatTile } from "@/components/common/stat-tile";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { PRIORITY } from "@/components/tasks/priority";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useInbox, useToday, useAllTasks, useTaskStats } from "@/hooks/use-tasks";
import { useSession } from "@/components/providers/session-provider";
import { createTask } from "@/lib/data/tasks";
import type { Task, TaskPriority } from "@/lib/types";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { t } = useT();
  const { user } = useSession();
  const stats = useTaskStats();
  const inbox = useInbox();
  const { today, overdue } = useToday();
  const all = useAllTasks();

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [quick, setQuick] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskPriority | "all">("all");

  function openNew() { setEditTask(undefined); setFormOpen(true); }
  function openEdit(task: Task) { setEditTask(task); setFormOpen(true); }

  async function quickAdd() {
    if (!user || !quick.trim()) return;
    await createTask(user.id, { title: quick });
    setQuick("");
  }

  const filtered = useMemo(() => {
    return all
      .filter((tk) => (filter === "all" ? true : tk.priority === filter))
      .filter((tk) => (search ? tk.title.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || (a.date ?? "~").localeCompare(b.date ?? "~"));
  }, [all, filter, search]);

  return (
    <PageContainer wide>
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.subtitle")}
        icon={<ListTodo className="size-5" />}
        actions={<Button onClick={openNew} className="gap-1.5"><Plus className="size-4" /> {t("tasks.new")}</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("tasks.pending")} value={stats.pending} icon={ListTodo} />
        <StatTile label={t("tasks.today")} value={today.length} icon={CalendarDays} accentClass="text-productivity" />
        <StatTile label={t("tasks.overdue")} value={stats.overdue} icon={AlertTriangle} accentClass="text-destructive" />
        <StatTile label={t("tasks.completed")} value={stats.completed} icon={CheckCheck} accentClass="text-health" />
      </div>

      {/* Quick capture → inbox */}
      <div className="mb-5 flex gap-2">
        <Input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickAdd()}
          placeholder={t("tasks.namePlaceholder")}
        />
        <Button variant="secondary" onClick={quickAdd} className="gap-1.5"><Plus className="size-4" /> {t("tasks.inbox")}</Button>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">{t("tasks.today")}{overdue.length > 0 && <Badge variant="destructive" className="ml-1.5 px-1.5">{overdue.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="inbox"><Inbox className="mr-1.5 size-3.5" /> {t("tasks.inbox")}{inbox.length > 0 && <span className="ml-1.5 text-muted-foreground">{inbox.length}</span>}</TabsTrigger>
          <TabsTrigger value="all">{t("tasks.all")}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {overdue.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
                    <AlertTriangle className="size-3.5" /> {t("tasks.overdue")}
                  </p>
                  <TaskList tasks={overdue} onEdit={openEdit} emptyText="" reorderable={false} />
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("tasks.today")}</p>
                <TaskList tasks={today} onEdit={openEdit} emptyText={t("tasks.emptyToday")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-xs text-muted-foreground">{t("tasks.assignHint")}</p>
              <TaskList tasks={inbox} onEdit={openEdit} emptyText={t("tasks.emptyInbox")} showDate={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("tasks.search")} className="pl-8" />
                </div>
                <div className="flex gap-1.5">
                  {(["all", "high", "medium", "low"] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? "default" : "outline"}
                      onClick={() => setFilter(f)}
                      className={cn("capitalize", filter !== f && f !== "all" && PRIORITY[f as TaskPriority].text)}
                    >
                      {f === "all" ? t("tasks.all") : t(PRIORITY[f as TaskPriority].labelKey)}
                    </Button>
                  ))}
                </div>
              </div>
              <TaskList tasks={filtered} onEdit={openEdit} emptyText={t("tasks.emptyInbox")} reorderable={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskForm open={formOpen} onOpenChange={setFormOpen} task={editTask} />
    </PageContainer>
  );
}
