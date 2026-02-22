import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, useNavigation, Link, useFetcher } from "react-router";
import { ArrowLeft, Trash, Timer1, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getTask, updateTask, deleteTask } from "~/lib/queries/tasks";
import { getProjects } from "~/lib/queries/projects";
import { getTimeEntries, createTimeEntry, stopTimer, deleteTimeEntry } from "~/lib/queries/time-entries";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { formatDate, formatDuration } from "~/lib/utils/dates";
import {
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_LABEL,
} from "~/lib/constants";

export const meta: MetaFunction = () => [{ title: "Tâche — Task" }];

export async function loader({ params }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [task, projects, timeEntries] = await Promise.all([
    getTask(params.taskId!, user.id),
    getProjects(user.id),
    getTimeEntries(user.id, { taskId: params.taskId! }),
  ]);

  const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
  const activeTimer = timeEntries.find((e) => !e.ended_at);

  return { task, projects, timeEntries, totalMinutes, activeTimer };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    await deleteTask(params.taskId!, user.id);
    throw redirect("/tasks");
  }

  if (intent === "update") {
    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: "Le titre est requis." };

    await updateTask(params.taskId!, user.id, {
      title,
      project_id: (formData.get("project_id") as string) || null,
      description: (formData.get("description") as string)?.trim() || null,
      status: formData.get("status") as "todo" | "in_progress" | "review" | "done",
      priority: formData.get("priority") as "low" | "medium" | "high" | "urgent",
      due_date: (formData.get("due_date") as string) || null,
      estimated_hours: formData.get("estimated_hours") ? parseFloat(formData.get("estimated_hours") as string) : null,
    });
    return { success: true };
  }

  if (intent === "start_timer") {
    await createTimeEntry(user.id, {
      task_id: params.taskId!,
      project_id: (formData.get("project_id") as string) || null,
      description: null,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_minutes: null,
      is_billable: true,
    });
    return { success: true };
  }

  if (intent === "stop_timer") {
    const entryId = formData.get("entry_id") as string;
    await stopTimer(entryId, user.id, new Date().toISOString());
    return { success: true };
  }

  if (intent === "delete_entry") {
    const entryId = formData.get("entry_id") as string;
    await deleteTimeEntry(entryId, user.id);
    return { success: true };
  }

  return {};
}

export default function TaskDetail() {
  const { task, projects, timeEntries, totalMinutes, activeTimer } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/tasks" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={14} color="currentColor" />
          Tâches
        </Link>
      </div>

      <PageHeader
        title={task.title}
        description={task.project?.name ?? "Tâche"}
        action={
          <Form method="post" onSubmit={(e) => { if (!confirm("Supprimer cette tâche ?")) e.preventDefault(); }}>
            <input type="hidden" name="intent" value="delete" />
            <Button type="submit" variant="danger" size="sm" leftIcon={<Trash size={14} color="currentColor" />}>
              Supprimer
            </Button>
          </Form>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <Form method="post">
            <input type="hidden" name="intent" value="update" />
            <Card padding="lg">
              <div className="flex flex-col gap-4">
                <Input label="Titre *" name="title" defaultValue={task.title} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Projet" name="project_id" defaultValue={task.project_id ?? ""}>
                    <option value="">— Aucun projet —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                  <Select label="Priorité" name="priority" defaultValue={task.priority}>
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Statut" name="status" defaultValue={task.status}>
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="review">En révision</option>
                    <option value="done">Terminé</option>
                  </Select>
                  <Input label="Heures estimées" name="estimated_hours" type="number" min="0" step="0.5" defaultValue={task.estimated_hours ?? ""} />
                </div>
                <Input label="Date d'échéance" name="due_date" type="date" defaultValue={task.due_date ?? ""} />
                <Textarea label="Description" name="description" defaultValue={task.description ?? ""} rows={3} />
              </div>
            </Card>
            <div className="mt-4">
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </Form>

          {/* Time entries */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-zinc-900">
                Temps suivi — {formatDuration(totalMinutes)}
              </h2>
              {!activeTimer && (
                <Form method="post">
                  <input type="hidden" name="intent" value="start_timer" />
                  <input type="hidden" name="project_id" value={task.project_id ?? ""} />
                  <Button type="submit" variant="secondary" size="sm" leftIcon={<Timer1 size={14} color="currentColor" />}>
                    Démarrer
                  </Button>
                </Form>
              )}
            </div>

            {activeTimer && (
              <div className="mb-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-700">Chronomètre en cours</span>
                </div>
                <Form method="post">
                  <input type="hidden" name="intent" value="stop_timer" />
                  <input type="hidden" name="entry_id" value={activeTimer.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    Arrêter
                  </Button>
                </Form>
              </div>
            )}

            {timeEntries.filter((e) => e.ended_at).length > 0 && (
              <Card padding="none">
                <div className="divide-y divide-zinc-100">
                  {timeEntries.filter((e) => e.ended_at).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-zinc-700">{formatDate(entry.started_at)}</p>
                        {entry.description && (
                          <p className="text-xs text-zinc-400">{entry.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-900">
                          {formatDuration(entry.duration_minutes ?? 0)}
                        </span>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete_entry" />
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <button type="submit" className="text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash size={14} color="currentColor" />
                          </button>
                        </Form>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Statut & Priorité</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Statut</span>
                <Badge variant={TASK_STATUS_BADGE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Priorité</span>
                <Badge variant={TASK_PRIORITY_BADGE[task.priority]}>{TASK_PRIORITY_LABEL[task.priority]}</Badge>
              </div>
              {task.due_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Échéance</span>
                  <span className="text-sm text-zinc-700">{formatDate(task.due_date)}</span>
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Estimé</span>
                  <span className="text-sm text-zinc-700">{task.estimated_hours}h</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Suivi</span>
                <span className="text-sm font-semibold text-zinc-900">{formatDuration(totalMinutes)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
