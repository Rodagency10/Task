import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { supabase } from "~/lib/supabase";
import { createExpense, getExpenseCategories } from "~/lib/queries/expenses";
import { toISODate } from "~/lib/utils/dates";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export const meta: MetaFunction = () => [{ title: "Nouvelle dépense — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const categories = await getExpenseCategories(user.id);
  return { categories };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const description = (formData.get("description") as string)?.trim();
  const amountRaw = formData.get("amount") as string;

  if (!description) return { error: "La description est requise." };
  if (!amountRaw || parseFloat(amountRaw) <= 0)
    return { error: "Le montant doit être supérieur à 0." };

  try {
    await createExpense(user.id, {
      description,
      amount: parseFloat(amountRaw),
      date: (formData.get("date") as string) || toISODate(),
      category_id: (formData.get("category_id") as string) || null,
      payment_method:
        ((formData.get("payment_method") as string) ||
          "cash") as "cash" | "card" | "bank_transfer" | "mobile_money" | "other",
      notes: (formData.get("notes") as string)?.trim() || null,
      receipt_url: null,
      is_business: formData.get("is_business") === "true",
    });
    throw redirect("/finance/expenses");
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

export default function NewExpense() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <PageHeader title="Nouvelle dépense" description="Enregistrez une nouvelle dépense" />

      <div className="max-w-2xl">
        <Form method="post">
          <Card padding="lg">
            <div className="flex flex-col gap-4">
              {actionData?.error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {actionData.error}
                </div>
              )}

              <Input
                label="Description *"
                name="description"
                placeholder="Achat matériel..."
                required
                autoFocus
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Montant (€) *"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                <Input label="Date" name="date" type="date" defaultValue={toISODate()} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Catégorie" name="category_id">
                  <option value="">— Sans catégorie —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                <Select label="Mode de paiement" name="payment_method" defaultValue="card">
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Autre</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_business"
                  value="true"
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Dépense professionnelle</span>
              </label>

              <Textarea
                label="Notes"
                name="notes"
                placeholder="Détails supplémentaires..."
                rows={2}
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
