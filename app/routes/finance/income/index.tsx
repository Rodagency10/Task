import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, useNavigation, Link, useSearchParams } from "react-router";
import { MoneySend, Add, Trash, ReceiptText } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getIncome, createIncome, deleteIncome } from "~/lib/queries/income";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { Input, Textarea } from "~/components/ui/Input";
import { PeriodFilter, filterByPeriod, type PeriodKey } from "~/components/ui/PeriodFilter";
import { formatDate, toISODate } from "~/lib/utils/dates";
import { useCurrency } from "~/lib/context/currency";

export const meta: MetaFunction = () => [{ title: "Revenus — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const income = await getIncome(user.id);
  return { income };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const source = (formData.get("source") as string)?.trim();
    const amountRaw = formData.get("amount") as string;
    if (!source) return { error: "La source est requise." };
    if (!amountRaw || parseFloat(amountRaw) <= 0)
      return { error: "Le montant doit être supérieur à 0." };

    await createIncome(user.id, {
      source,
      description: (formData.get("description") as string)?.trim() || null,
      amount: parseFloat(amountRaw),
      date: (formData.get("date") as string) || toISODate(),
      invoice_id: null,
      is_recurring: false,
    });
    return { success: true };
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteIncome(id, user.id);
    return { deleted: true };
  }

  return {};
}

export default function IncomeIndex() {
  const { income } = useLoaderData<typeof loader>();
  const { formatCurrency } = useCurrency();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const period = (searchParams.get("period") ?? "all") as PeriodKey;

  const filtered = filterByPeriod(income, period, (i) => i.date);
  const total = filtered.reduce((sum, i) => sum + i.amount, 0);
  const manualIncome = filtered.filter((i) => !i.invoice_id);
  const invoiceIncome = filtered.filter((i) => i.invoice_id);

  return (
    <div>
      <PageHeader
        title="Revenus"
        description="Revenus depuis vos factures et entrées manuelles"
      />

      <PeriodFilter className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income list */}
        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<MoneySend size={40} color="currentColor" variant="Bulk" />}
              title="Aucun revenu"
              description="Les revenus issus des factures payées apparaissent automatiquement ici."
            />
          ) : (
            <>
              {/* Auto-synced from invoices */}
              {invoiceIncome.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                    <ReceiptText size={14} color="currentColor" />
                    Depuis les factures
                  </h2>
                  <Card padding="none">
                    <div className="divide-y divide-zinc-100">
                      {invoiceIncome.map((inc) => (
                        <div
                          key={inc.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {inc.source}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-zinc-400">{formatDate(inc.date)}</p>
                              {inc.invoice && (
                                <Link
                                  to={`/invoices/${inc.invoice_id}`}
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  {inc.invoice.invoice_number}
                                </Link>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600 shrink-0">
                            +{formatCurrency(inc.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Manual income */}
              {manualIncome.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-700 mb-3">
                    Revenus manuels
                  </h2>
                  <Card padding="none">
                    <div className="divide-y divide-zinc-100">
                      {manualIncome.map((inc) => (
                        <div
                          key={inc.id}
                          className="flex items-center justify-between px-4 py-3 group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {inc.source}
                            </p>
                            <p className="text-xs text-zinc-400">{formatDate(inc.date)}</p>
                            {inc.description && (
                              <p className="text-xs text-zinc-400 italic">{inc.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-semibold text-emerald-600">
                              +{formatCurrency(inc.amount)}
                            </span>
                            <Form method="post">
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="id" value={inc.id} />
                              <button
                                type="submit"
                                className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash size={14} color="currentColor" />
                              </button>
                            </Form>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <span className="text-sm text-zinc-500">
                  Total :{" "}
                  <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Add manual income form */}
        <div>
          <h2 className="text-base font-semibold text-zinc-900 mb-3">Ajouter un revenu</h2>
          <Form method="post">
            <input type="hidden" name="intent" value="create" />
            <Card padding="lg">
              <div className="flex flex-col gap-4">
                <Input
                  label="Source *"
                  name="source"
                  placeholder="Prestation, vente..."
                  required
                />
                <Input
                  label="Montant *"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                <Input label="Date" name="date" type="date" defaultValue={toISODate()} />
                <Textarea
                  label="Description"
                  name="description"
                  placeholder="Détails..."
                  rows={2}
                />
              </div>
            </Card>
            <div className="mt-3">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                leftIcon={<Add size={16} color="currentColor" />}
              >
                {isSubmitting ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
