import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, useNavigation, Link } from "react-router";
import { ArrowLeft, Trash } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import {
  getExpense,
  getExpenseCategories,
  updateExpense,
  deleteExpense,
} from "~/lib/queries/expenses";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { formatCurrency } from "~/lib/utils/currency";
import { formatDate } from "~/lib/utils/dates";

export const meta: MetaFunction = () => [{ title: "Dépense — Task" }];

export async function loader({ params }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [expense, categories] = await Promise.all([
    getExpense(params.expenseId!, user.id),
    getExpenseCategories(user.id),
  ]);

  return { expense, categories };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    await deleteExpense(params.expenseId!, user.id);
    throw redirect("/finance/expenses");
  }

  if (intent === "update") {
    const description = (formData.get("description") as string)?.trim();
    if (!description) return { error: "La description est requise." };

    await updateExpense(params.expenseId!, user.id, {
      description,
      amount: parseFloat(formData.get("amount") as string),
      date: formData.get("date") as string,
      category_id: (formData.get("category_id") as string) || null,
      payment_method: (formData.get("payment_method") as string) as
        | "cash"
        | "card"
        | "bank_transfer"
        | "mobile_money"
        | "other",
      notes: (formData.get("notes") as string)?.trim() || null,
      is_business: formData.get("is_business") === "true",
    });
    return { success: true };
  }

  return {};
}

export default function ExpenseDetail() {
  const { expense, categories } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/finance/expenses"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} color="currentColor" />
          Dépenses
        </Link>
      </div>

      <PageHeader
        title={expense.description}
        description={`${formatCurrency(expense.amount)} · ${formatDate(expense.date)}`}
        action={
          <Form
            method="post"
            onSubmit={(e) => {
              if (!confirm("Supprimer cette dépense ?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="intent" value="delete" />
            <Button
              type="submit"
              variant="danger"
              size="sm"
              leftIcon={<Trash size={14} color="currentColor" />}
            >
              Supprimer
            </Button>
          </Form>
        }
      />

      <div className="max-w-2xl">
        <Form method="post">
          <input type="hidden" name="intent" value="update" />
          <Card padding="lg">
            <div className="flex flex-col gap-4">
              <Input
                label="Description *"
                name="description"
                defaultValue={expense.description}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Montant (€)"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={expense.amount}
                />
                <Input label="Date" name="date" type="date" defaultValue={expense.date} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Catégorie"
                  name="category_id"
                  defaultValue={expense.category_id ?? ""}
                >
                  <option value="">— Sans catégorie —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Mode de paiement"
                  name="payment_method"
                  defaultValue={expense.payment_method}
                >
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
                  defaultChecked={expense.is_business}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-700">Dépense professionnelle</span>
              </label>
              <Textarea
                label="Notes"
                name="notes"
                defaultValue={expense.notes ?? ""}
                rows={2}
              />
            </div>
          </Card>
          <div className="mt-4">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
