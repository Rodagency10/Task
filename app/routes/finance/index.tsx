import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { Wallet, TrendUp, MoneyRecive, MoneyForbidden, ArrowRight2 } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getFinanceSummary } from "~/lib/utils/finance";
import { getExpenses } from "~/lib/queries/expenses";
import { getDebts } from "~/lib/queries/debts";
import { getIncome } from "~/lib/queries/income";
import { PageHeader } from "~/components/layout/PageHeader";
import { StatCard } from "~/components/ui/StatCard";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { PeriodFilter, filterByPeriod, type PeriodKey } from "~/components/ui/PeriodFilter";
import { formatDate } from "~/lib/utils/dates";
import { DEBT_STATUS_BADGE, DEBT_STATUS_LABEL } from "~/lib/constants";
import { useCurrency } from "~/lib/context/currency";

export const meta: MetaFunction = () => [{ title: "Finances — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [finance, expenses, debts, income] = await Promise.all([
    getFinanceSummary(user.id),
    getExpenses(user.id),
    getDebts(user.id),
    getIncome(user.id),
  ]);

  return {
    finance,
    expenses,
    activeDebts: debts.filter((d) => d.status !== "paid"),
    income,
  };
}

export default function FinanceIndex() {
  const { finance, expenses, activeDebts, income } = useLoaderData<typeof loader>();
  const { formatCurrency } = useCurrency();
  const [searchParams] = useSearchParams();
  const period = (searchParams.get("period") ?? "all") as PeriodKey;

  const filteredExpenses = filterByPeriod(expenses, period, (e) => e.date);
  const filteredIncome = filterByPeriod(income, period, (i) => i.date);

  const recentExpenses = filteredExpenses.slice(0, 5);
  const recentIncome = filteredIncome.slice(0, 5);

  return (
    <div>
      <PageHeader title="Finances" description="Vue d'ensemble de vos finances personnelles" />

      {/* Period filter */}
      <PeriodFilter className="mb-6" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Solde net"
          value={formatCurrency(finance.netBalance)}
          trend={finance.netBalance >= 0 ? "up" : "down"}
          trendLabel="Revenus − Dépenses"
          icon={<Wallet size={20} color="currentColor" />}
          iconColor="text-blue-600"
        />
        <StatCard
          label="Revenus réalisés"
          value={formatCurrency(finance.paidRevenue)}
          trend="up"
          trendLabel="Factures payées"
          icon={<TrendUp size={20} color="currentColor" />}
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Dépenses totales"
          value={formatCurrency(finance.totalExpenses)}
          trend="down"
          trendLabel="Total dépensé"
          icon={<MoneyRecive size={20} color="currentColor" />}
          iconColor="text-red-500"
        />
        <StatCard
          label="Dettes en cours"
          value={formatCurrency(finance.pendingDebts)}
          trend="neutral"
          trendLabel="Montant à recevoir"
          icon={<MoneyForbidden size={20} color="currentColor" />}
          iconColor="text-amber-600"
        />
      </div>

      {/* Projected revenue banner */}
      {(finance.pendingRevenue > 0 || finance.projectedRevenue > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {finance.pendingRevenue > 0 && (
            <Card padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">En attente</p>
                  <p className="text-xl font-bold text-zinc-950 mt-1">
                    {formatCurrency(finance.pendingRevenue)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Factures envoyées non payées</p>
                </div>
                <Link
                  to="/invoices?status=sent"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Voir <ArrowRight2 size={12} color="currentColor" />
                </Link>
              </div>
            </Card>
          )}
          {finance.projectedRevenue > 0 && (
            <Card padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Projeté</p>
                  <p className="text-xl font-bold text-zinc-950 mt-1">
                    {formatCurrency(finance.projectedRevenue)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Projets actifs non encore facturés</p>
                </div>
                <Link
                  to="/projects"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Voir <ArrowRight2 size={12} color="currentColor" />
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent expenses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">Dépenses récentes</h2>
            <Link
              to="/finance/expenses"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Voir tout <ArrowRight2 size={12} color="currentColor" />
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-zinc-400 text-center py-4">Aucune dépense</p>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-zinc-100">
                {recentExpenses.map((expense) => (
                  <Link
                    key={expense.id}
                    to={`/finance/expenses/${expense.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
                      <p className="text-xs text-zinc-400">{formatDate(expense.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 shrink-0">
                      −{formatCurrency(expense.amount)}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Active debts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">Dettes actives</h2>
            <Link
              to="/finance/debts"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Voir tout <ArrowRight2 size={12} color="currentColor" />
            </Link>
          </div>
          {activeDebts.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-zinc-400 text-center py-4">Aucune dette active</p>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-zinc-100">
                {activeDebts.slice(0, 5).map((debt) => {
                  const remaining = debt.amount - debt.amount_paid;
                  return (
                    <Link
                      key={debt.id}
                      to={`/finance/debts/${debt.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{debt.person_name}</p>
                        <Badge variant={DEBT_STATUS_BADGE[debt.status]} size="sm">
                          {DEBT_STATUS_LABEL[debt.status]}
                        </Badge>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(remaining)}</p>
                        <p className="text-xs text-zinc-400">sur {formatCurrency(debt.amount)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Recent income */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">Revenus récents</h2>
            <Link
              to="/finance/income"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Voir tout <ArrowRight2 size={12} color="currentColor" />
            </Link>
          </div>
          {recentIncome.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-zinc-400 text-center py-4">Aucun revenu</p>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-zinc-100">
                {recentIncome.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{inc.source}</p>
                      <p className="text-xs text-zinc-400">{formatDate(inc.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 shrink-0">
                      +{formatCurrency(inc.amount)}
                    </span>
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
