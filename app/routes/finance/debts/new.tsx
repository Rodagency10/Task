import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useNavigation } from "react-router";
import { supabase } from "~/lib/supabase";
import { createDebt } from "~/lib/queries/debts";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export const meta: MetaFunction = () => [{ title: "Nouvelle dette — Task" }];

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
  const personName = (formData.get("person_name") as string)?.trim();
  const amountRaw = formData.get("amount") as string;

  if (!personName) return { error: "Le nom de la personne est requis." };
  if (!amountRaw || parseFloat(amountRaw) <= 0)
    return { error: "Le montant doit être supérieur à 0." };

  try {
    const debt = await createDebt(user.id, {
      person_name: personName,
      person_contact: (formData.get("person_contact") as string)?.trim() || null,
      amount: parseFloat(amountRaw),
      description: (formData.get("description") as string)?.trim() || null,
      due_date: (formData.get("due_date") as string) || null,
    });
    throw redirect(`/finance/debts/${debt.id}`);
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

export default function NewDebt() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <PageHeader
        title="Nouvelle dette"
        description="Enregistrez une personne qui vous doit de l'argent"
      />

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
                  label="Nom de la personne *"
                  name="person_name"
                  placeholder="Jean Dupont"
                  required
                  autoFocus
                />
                <Input
                  label="Contact (email / téléphone)"
                  name="person_contact"
                  placeholder="jean@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Montant dû (€) *"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                <Input label="Date d'échéance" name="due_date" type="date" />
              </div>

              <Textarea
                label="Description"
                name="description"
                placeholder="Raison du prêt ou détails..."
                rows={3}
              />
            </div>
          </Card>

          <div className="flex items-center gap-3 mt-4">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
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
