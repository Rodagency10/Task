import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useNavigation, useLoaderData, useSearchParams } from "react-router";
import { supabase } from "~/lib/supabase";
import { createTask } from "~/lib/queries/tasks";
import { getProjects } from "~/lib/queries/projects";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export const meta: MetaFunction = () => [{ title: "Nouvelle tâche — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const projects = await getProjects(user.id);
  return { projects };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Le titre de la tâche est requis." };

  const projectId = (formData.get("project_id") as string) || null;
  const estimatedHoursRaw = formData.get("estimated_hours") as string;

  try {
    const task = await createTask(user.id, {
      title,
      project_id: projectId,
      description: (formData.get("description") as string)?.trim() || null,
      status: (formData.get("status") as "todo" | "in_progress" | "review" | "done") || "todo",
      priority: (formData.get("priority") as "low" | "medium" | "high" | "urgent") || "medium",
      due_date: (formData.get("due_date") as string) || null,
      estimated_hours: estimatedHoursRaw ? parseFloat(estimatedHoursRaw) : null,
    });
    throw redirect(`/tasks/${task.id}`);
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

export default function NewTask() {
  const { projects } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const defaultProjectId = searchParams.get("projectId") ?? "";

  return (
    <div>
      <PageHeader title="Nouvelle tâche" description="Ajoutez une tâche à votre liste" />

      <div className="max-w-2xl">
        <Form method="post">
          <Card padding="lg">
            <div className="flex flex-col gap-4">
              {actionData?.error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {actionData.error}
                </div>
              )}

              <Input label="Titre *" name="title" placeholder="Concevoir la maquette" required autoFocus />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Projet" name="project_id" defaultValue={defaultProjectId}>
                  <option value="">— Aucun projet —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                <Select label="Priorité" name="priority" defaultValue="medium">
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Statut" name="status" defaultValue="todo">
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="review">En révision</option>
                  <option value="done">Terminé</option>
                </Select>
                <Input label="Heures estimées" name="estimated_hours" type="number" min="0" step="0.5" placeholder="0" />
              </div>

              <Input label="Date d'échéance" name="due_date" type="date" />

              <Textarea
                label="Description"
                name="description"
                placeholder="Détails de la tâche..."
                rows={3}
              />
            </div>
          </Card>

          <div className="flex items-center gap-3 mt-4">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer la tâche"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => history.back()}>
              Annuler
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
