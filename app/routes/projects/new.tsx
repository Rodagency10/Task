import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { supabase } from "~/lib/supabase";
import { createProject } from "~/lib/queries/projects";
import { getClients } from "~/lib/queries/clients";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export const meta: MetaFunction = () => [{ title: "Nouveau projet — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const clients = await getClients(user.id);
  return { clients };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Le nom du projet est requis." };

  const clientId = (formData.get("client_id") as string) || null;
  const status = (formData.get("status") as string) || "draft";
  const description = (formData.get("description") as string)?.trim() || null;
  const fixedPriceRaw = formData.get("fixed_price") as string;
  const budgetRaw = formData.get("budget") as string;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  try {
    const project = await createProject(user.id, {
      name,
      client_id: clientId,
      status: status as "draft" | "active" | "paused" | "completed",
      description,
      fixed_price: fixedPriceRaw ? parseFloat(fixedPriceRaw) : null,
      budget: budgetRaw ? parseFloat(budgetRaw) : null,
      hourly_rate: null,
      start_date: startDate,
      end_date: endDate,
    });
    throw redirect(`/projects/${project.id}`);
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

export default function NewProject() {
  const { clients } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <PageHeader title="Nouveau projet" description="Créez un nouveau projet" />

      <div className="max-w-2xl">
        <Form method="post">
          <Card padding="lg">
            <div className="flex flex-col gap-4">
              {actionData?.error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {actionData.error}
                </div>
              )}

              <Input label="Nom du projet *" name="name" placeholder="Refonte site web" required autoFocus />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Client" name="client_id">
                  <option value="">— Aucun client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` (${c.company})` : ""}
                    </option>
                  ))}
                </Select>

                <Select label="Statut" name="status" defaultValue="draft">
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="paused">Pausé</option>
                  <option value="completed">Terminé</option>
                </Select>
              </div>

              <Textarea
                label="Description"
                name="description"
                placeholder="Décrivez le projet..."
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Prix fixe (€)" name="fixed_price" type="number" min="0" step="0.01" placeholder="0.00" />
                <Input label="Budget (€)" name="budget" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Date de début" name="start_date" type="date" />
                <Input label="Date de fin" name="end_date" type="date" />
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-3 mt-4">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer le projet"}
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
