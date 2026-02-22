import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useFetcher, useSearchParams } from "react-router";
import { TaskSquare, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getTasks, updateTask } from "~/lib/queries/tasks";
import { getProjects } from "~/lib/queries/projects";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { formatDate } from "~/lib/utils/dates";
import {
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_LABEL,
} from "~/lib/constants";
import type { TaskStatus } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Tâches — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [tasks, projects] = await Promise.all([
    getTasks(user.id),
    getProjects(user.id),
  ]);

  return { tasks, projects };
}

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "À faire" },
  { key: "in_progress", label: "En cours" },
  { key: "review", label: "En révision" },
  { key: "done", label: "Terminé" },
];

const STATUS_HEADER_COLOR: Record<TaskStatus, string> = {
  todo: "border-zinc-300",
  in_progress: "border-blue-400",
  review: "border-amber-400",
  done: "border-emerald-400",
};

export default function TasksIndex() {
  const { tasks, projects } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "kanban";
  const projectFilter = searchParams.get("project") ?? "";

  const filtered = projectFilter
    ? tasks.filter((t) => t.project_id === projectFilter)
    : tasks;

  return (
    <div>
      <PageHeader
        title="Tâches"
        description={`${tasks.length} tâche${tasks.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setSearchParams((p) => { p.set("view", "kanban"); return p; })}
                className={["px-3 py-1.5 text-xs font-medium transition-colors", view === "kanban" ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-50"].join(" ")}
              >
                Kanban
              </button>
              <button
                onClick={() => setSearchParams((p) => { p.set("view", "list"); return p; })}
                className={["px-3 py-1.5 text-xs font-medium transition-colors", view === "list" ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-50"].join(" ")}
              >
                Liste
              </button>
            </div>
            <Link to="/tasks/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouvelle tâche
              </Button>
            </Link>
          </div>
        }
      />

      {/* Project filter */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSearchParams((p) => { p.delete("project"); return p; })}
            className={["px-3 py-1 text-xs font-medium rounded-full border transition-colors", !projectFilter ? "bg-zinc-950 text-white border-zinc-950" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"].join(" ")}
          >
            Tous
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSearchParams((prev) => { prev.set("project", p.id); return prev; })}
              className={["px-3 py-1 text-xs font-medium rounded-full border transition-colors", projectFilter === p.id ? "bg-zinc-950 text-white border-zinc-950" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"].join(" ")}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<TaskSquare size={40} color="currentColor" variant="Bulk" />}
          title="Aucune tâche"
          description="Créez votre première tâche pour organiser votre travail."
          action={
            <Link to="/tasks/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouvelle tâche
              </Button>
            </Link>
          }
        />
      ) : view === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-2 min-w-50">
                <div className={["flex items-center justify-between px-3 py-2 bg-white border-t-2 border-x border-b border-zinc-200 rounded-t-lg", STATUS_HEADER_COLOR[col.key]].join(" ").replace("border-x border-b border-zinc-200", "border-zinc-200")}>
                  <span className="text-xs font-semibold text-zinc-700">{col.label}</span>
                  <span className="text-xs text-zinc-400">{colTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {colTasks.map((task) => (
                    <Link key={task.id} to={`/tasks/${task.id}`}>
                      <Card padding="sm" hoverable>
                        <p className="text-sm font-medium text-zinc-900 mb-1.5 line-clamp-2">{task.title}</p>
                        {task.project && (
                          <p className="text-xs text-zinc-400 mb-2">{task.project.name}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge variant={TASK_PRIORITY_BADGE[task.priority]} size="sm">
                            {TASK_PRIORITY_LABEL[task.priority]}
                          </Badge>
                          {task.due_date && (
                            <span className="text-xs text-zinc-400">{formatDate(task.due_date)}</span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-zinc-100">
            {filtered.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <TaskSquare size={14} color="currentColor" className="text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
                    {task.project && (
                      <p className="text-xs text-zinc-400">{task.project.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.due_date && (
                    <span className="text-xs text-zinc-400 hidden sm:block">{formatDate(task.due_date)}</span>
                  )}
                  <Badge variant={TASK_PRIORITY_BADGE[task.priority]} size="sm">
                    {TASK_PRIORITY_LABEL[task.priority]}
                  </Badge>
                  <Badge variant={TASK_STATUS_BADGE[task.status]} size="sm">
                    {TASK_STATUS_LABEL[task.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
