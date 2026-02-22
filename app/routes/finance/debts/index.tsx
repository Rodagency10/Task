import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { MoneyForbidden, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getDebts } from "~/lib/queries/debts";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { PeriodFilter, filterByPeriod, type PeriodKey } from "~/components/ui/PeriodFilter";
import { formatDate } from "~/lib/utils/dates";
import { DEBT_STATUS_BADGE, DEBT_STATUS_LABEL } from "~/lib/constants";
import { useCurrency } from "~/lib/context/currency";

export const meta: MetaFunction = () => [{ title: "Dettes — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const debts = await getDebts(user.id);
  return { debts };
}

export default function DebtsIndex() {
  const { debts } = useLoaderData<typeof loader>();
  const { formatCurrency } = useCurrency();
  const [searchParams] = useSearchParams();
  const period = (searchParams.get("period") ?? "all") as PeriodKey;

  const filtered = filterByPeriod(debts, period, (d) => d.created_at);

  const totalPending = filtered
    .filter((d) => d.status !== "paid")
    .reduce((sum, d) => sum + (d.amount - d.amount_paid), 0);

  return (
    <div>
      <PageHeader
        title="Dettes"
        description="Personnes qui vous doivent de l'argent"
        action={
          <Link to="/finance/debts/new">
            <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
              Nouvelle dette
            </Button>
          </Link>
        }
      />

      <PeriodFilter className="mb-6" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MoneyForbidden size={40} color="currentColor" variant="Bulk" />}
          title="Aucune dette enregistrée"
          description="Enregistrez les personnes qui vous doivent de l'argent."
          action={
            <Link to="/finance/debts/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouvelle dette
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {totalPending > 0 && (
            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700">
                Montant total à recevoir :{" "}
                <span className="font-bold">{formatCurrency(totalPending)}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((debt) => {
              const remaining = debt.amount - debt.amount_paid;
              const progressPct =
                debt.amount > 0 ? Math.round((debt.amount_paid / debt.amount) * 100) : 0;

              return (
                <Link key={debt.id} to={`/finance/debts/${debt.id}`}>
                  <Card padding="lg" hoverable>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {debt.person_name}
                        </p>
                        {debt.person_contact && (
                          <p className="text-xs text-zinc-400 truncate">{debt.person_contact}</p>
                        )}
                      </div>
                      <Badge variant={DEBT_STATUS_BADGE[debt.status]} size="sm">
                        {DEBT_STATUS_LABEL[debt.status]}
                      </Badge>
                    </div>

                    {debt.description && (
                      <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{debt.description}</p>
                    )}

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>Payé : {formatCurrency(debt.amount_paid)}</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full">
                        <div
                          className="h-1.5 bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <div>
                        <p className="text-xs text-zinc-400">Restant</p>
                        <p className="text-base font-bold text-zinc-950">
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                      {debt.due_date && (
                        <div className="text-right">
                          <p className="text-xs text-zinc-400">Échéance</p>
                          <p className="text-xs font-medium text-zinc-700">
                            {formatDate(debt.due_date)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
