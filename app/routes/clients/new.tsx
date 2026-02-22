import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useNavigation } from "react-router";
import { supabase } from "~/lib/supabase";
import { createClient } from "~/lib/queries/clients";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export const meta: MetaFunction = () => [{ title: "Nouveau client — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const company = (formData.get("company") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) return { error: "Le nom du client est requis." };

  try {
    const client = await createClient(user.id, { name, email, phone, company, address, notes });
    throw redirect(`/clients/${client.id}`);
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

export default function NewClient() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <PageHeader title="Nouveau client" description="Ajoutez un nouveau client à votre liste" />

      <div className="max-w-2xl">
        <Form method="post">
          <Card padding="lg">
            <div className="flex flex-col gap-4">
              {actionData?.error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {actionData.error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom *"
                  name="name"
                  placeholder="Jean Dupont"
                  required
                  autoFocus
                />
                <Input
                  label="Entreprise"
                  name="company"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="jean@example.com"
                />
                <Input
                  label="Téléphone"
                  name="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <Input
                label="Adresse"
                name="address"
                placeholder="123 Rue de la Paix, Paris"
              />

              <Textarea
                label="Notes"
                name="notes"
                placeholder="Informations supplémentaires sur ce client..."
                rows={3}
              />
            </div>
          </Card>

          <div className="flex items-center gap-3 mt-4">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Créer le client"}
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
