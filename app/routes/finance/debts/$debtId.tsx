import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, useNavigation, Link, useFetcher } from "react-router";
import { ArrowLeft, Trash, TickCircle } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getDebt, recordDebtPayment, cancelDebt } from "~/lib/queries/debts";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { formatDate } from "~/lib/utils/dates";
import { DEBT_STATUS_BADGE, DEBT_STATUS_LABEL } from "~/lib/constants";
import { useCurrency } from "~/lib/context/currency";
import { useConfirm } from "~/lib/context/confirm";

export const meta: MetaFunction = () => [{ title: "Dette — Task" }];

export async function loader({ params }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const debt = await getDebt(params.debtId!, user.id);
  return { debt };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "cancel") {
    await cancelDebt(params.debtId!, user.id);
    throw redirect("/finance/debts");
  }

  if (intent === "payment") {
    const amountRaw = formData.get("amount") as string;
    const amount = parseFloat(amountRaw);
    if (!amount || amount <= 0) return { error: "Le montant doit être supérieur à 0." };
    const notes = (formData.get("notes") as string)?.trim() || undefined;
    await recordDebtPayment(params.debtId!, user.id, amount, notes);
    return { success: true };
  }

  return {};
}

export default function DebtDetail() {
  const { debt } = useLoaderData<typeof loader>();
  const { formatCurrency } = useCurrency();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const confirm = useConfirm();
  const isSubmitting = navigation.state === "submitting";

  const remaining = debt.amount - debt.amount_paid;
  const progressPct =
    debt.amount > 0 ? Math.round((debt.amount_paid / debt.amount) * 100) : 0;

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Annuler cette dette ?",
      message: "Cette action est irréversible.",
      confirmLabel: "Annuler la dette",
      variant: "danger",
    });
    if (ok) {
      fetcher.submit({ intent: "cancel" }, { method: "post" });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/finance/debts"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} color="currentColor" />
          Dettes
        </Link>
      </div>

      <PageHeader
        title={debt.person_name}
        description={debt.description ?? "Dette"}
        action={
          <div className="flex items-center gap-2">
            {debt.status !== "cancelled" && debt.status !== "paid" && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash size={14} color="currentColor" />}
                onClick={handleCancel}
              >
                Annuler
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: summary + payment form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Summary card */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900">Résumé</h2>
              <Badge variant={DEBT_STATUS_BADGE[debt.status]}>
                {DEBT_STATUS_LABEL[debt.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Total</p>
                <p className="text-lg font-bold text-zinc-950">{formatCurrency(debt.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Payé</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(debt.amount_paid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Restant</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(remaining)}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>Progression</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full">
                <div
                  className="h-2 bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Record payment */}
          {debt.status !== "paid" && debt.status !== "cancelled" && (
            <Card padding="lg">
              <h2 className="text-base font-semibold text-zinc-900 mb-4">
                Enregistrer un paiement
              </h2>
              <Form method="post" className="flex flex-col gap-4">
                <input type="hidden" name="intent" value="payment" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Montant reçu *"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={remaining}
                    placeholder={`Max: ${formatCurrency(remaining)}`}
                    required
                  />
                  <Input label="Notes" name="notes" placeholder="Virement, espèces..." />
                </div>
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    leftIcon={<TickCircle size={16} color="currentColor" />}
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer le paiement"}
                  </Button>
                </div>
              </Form>
            </Card>
          )}

          {/* Payment history */}
          {debt.payments && debt.payments.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-zinc-900 mb-3">
                Historique des paiements
              </h2>
              <Card padding="none">
                <div className="divide-y divide-zinc-100">
                  {[...debt.payments]
                    .sort(
                      (a, b) =>
                        new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
                    )
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-zinc-700">
                            {formatDate(payment.paid_at)}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-zinc-400">{payment.notes}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-emerald-600">
                          +{formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right: contact info */}
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
              Contact
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">{debt.person_name}</p>
              {debt.person_contact && (
                <p className="text-sm text-zinc-500">{debt.person_contact}</p>
              )}
              {debt.due_date && (
                <div className="mt-2 pt-2 border-t border-zinc-100">
                  <p className="text-xs text-zinc-400">Échéance</p>
                  <p className="text-sm font-medium text-zinc-700">
                    {formatDate(debt.due_date)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
