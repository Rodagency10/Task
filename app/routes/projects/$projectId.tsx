import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, useNavigation, Link, useFetcher } from "react-router";
import { ArrowLeft, Trash, TaskSquare, Timer1, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getProject, updateProject, deleteProject } from "~/lib/queries/projects";
import { getClients } from "~/lib/queries/clients";
import { getTasks } from "~/lib/queries/tasks";
import { getTimeEntries } from "~/lib/queries/time-entries";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { formatCurrency } from "~/lib/utils/currency";
import { formatDate, formatDuration } from "~/lib/utils/dates";
import {
  PROJECT_STATUS_BADGE,
  PROJECT_STATUS_LABEL,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_LABEL,
} from "~/lib/constants";

export const meta: MetaFunction = () => [{ title: "Projet — Task" }];

export async function loader({ params }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [project, clients, tasks, timeEntries] = await Promise.all([
    getProject(params.projectId!, user.id),
    getClients(user.id),
    getTasks(user.id, { projectId: params.projectId! }),
    getTimeEntries(user.id, { projectId: params.projectId! }),
  ]);

  const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  return { project, clients, tasks, timeEntries, totalMinutes };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    await deleteProject(params.projectId!, user.id);
    throw redirect("/projects");
  }

  if (intent === "update") {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "Le nom est requis." };

    await updateProject(params.projectId!, user.id, {
      name,
      client_id: (formData.get("client_id") as string) || null,
      status: formData.get("status") as "draft" | "active" | "paused" | "completed",
      description: (formData.get("description") as string)?.trim() || null,
      fixed_price: formData.get("fixed_price") ? parseFloat(formData.get("fixed_price") as string) : null,
      budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : null,
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
    });
    return { success: true };
  }

  return {};
}

export default function ProjectDetail() {
  const { project, clients, tasks, totalMinutes } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review: tasks.filter((t) => t.status === "review"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/projects" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={14} color="currentColor" />
          Projets
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={project.client?.name ?? "Projet"}
        action={
          <div className="flex items-center gap-2">
            <Link to={`/tasks/new?projectId=${project.id}`}>
              <Button variant="secondary" size="sm" leftIcon={<Add size={14} color="currentColor" />}>
                Tâche
              </Button>
            </Link>
            <Form method="post" onSubmit={(e) => { if (!confirm("Supprimer ce projet ?")) e.preventDefault(); }}>
              <input type="hidden" name="intent" value="delete" />
              <Button type="submit" variant="danger" size="sm" leftIcon={<Trash size={14} color="currentColor" />}>
                Supprimer
              </Button>
            </Form>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <Form method="post">
            <input type="hidden" name="intent" value="update" />
            <Card padding="lg">
              <div className="flex flex-col gap-4">
                <Input label="Nom *" name="name" defaultValue={project.name} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Client" name="client_id" defaultValue={project.client_id ?? ""}>
                    <option value="">— Aucun client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>
                    ))}
                  </Select>
                  <Select label="Statut" name="status" defaultValue={project.status}>
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="paused">Pausé</option>
                    <option value="completed">Terminé</option>
                  </Select>
                </div>
                <Textarea label="Description" name="description" defaultValue={project.description ?? ""} rows={3} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Prix fixe (€)" name="fixed_price" type="number" min="0" step="0.01" defaultValue={project.fixed_price ?? ""} />
                  <Input label="Budget (€)" name="budget" type="number" min="0" step="0.01" defaultValue={project.budget ?? ""} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Date de début" name="start_date" type="date" defaultValue={project.start_date ?? ""} />
                  <Input label="Date de fin" name="end_date" type="date" defaultValue={project.end_date ?? ""} />
                </div>
              </div>
            </Card>
            <div className="mt-4">
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </Form>

          {/* Tasks */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-zinc-900">
                Tâches ({tasks.length})
              </h2>
              <Link to={`/tasks/new?projectId=${project.id}`} className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                + Ajouter
              </Link>
            </div>
            {tasks.length === 0 ? (
              <Card padding="lg">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <TaskSquare size={24} color="currentColor" className="text-zinc-300" />
                  <p className="text-sm text-zinc-500">Aucune tâche pour ce projet</p>
                </div>
              </Card>
            ) : (
              <Card padding="none">
                <div className="divide-y divide-zinc-100">
                  {tasks.map((task) => (
                    <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-zinc-400">Échéance : {formatDate(task.due_date)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Status badge */}
          <Card padding="md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Statut</span>
              <Badge variant={PROJECT_STATUS_BADGE[project.status]}>
                {PROJECT_STATUS_LABEL[project.status]}
              </Badge>
            </div>
          </Card>

          {/* Stats */}
          <Card padding="md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Résumé</h3>
            <div className="flex flex-col gap-3">
              {(project.fixed_price ?? project.budget) ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Budget</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {formatCurrency(project.fixed_price ?? project.budget ?? 0)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Temps suivi</span>
                <span className="text-sm font-semibold text-zinc-900">{formatDuration(totalMinutes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Tâches</span>
                <span className="text-sm font-semibold text-zinc-900">
                  {tasksByStatus.done.length}/{tasks.length}
                </span>
              </div>
              {project.start_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Début</span>
                  <span className="text-sm text-zinc-700">{formatDate(project.start_date)}</span>
                </div>
              )}
              {project.end_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Fin prévue</span>
                  <span className="text-sm text-zinc-700">{formatDate(project.end_date)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Progress by status */}
          {tasks.length > 0 && (
            <Card padding="md">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Avancement</h3>
              <div className="flex flex-col gap-2">
                {(["todo", "in_progress", "review", "done"] as const).map((status) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-600">{TASK_STATUS_LABEL[status]}</span>
                    <Badge variant={TASK_STATUS_BADGE[status]} size="sm">
                      {tasksByStatus[status].length}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
