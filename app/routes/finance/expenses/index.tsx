import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { MoneyRecive, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getExpenses, getExpenseCategories } from "~/lib/queries/expenses";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { formatCurrency } from "~/lib/utils/currency";
import { formatDate } from "~/lib/utils/dates";

export const meta: MetaFunction = () => [{ title: "Dépenses — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [expenses, categories] = await Promise.all([
    getExpenses(user.id),
    getExpenseCategories(user.id),
  ]);

  return { expenses, categories };
}

export default function ExpensesIndex() {
  const { expenses, categories } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") ?? "";

  const filtered = categoryFilter
    ? expenses.filter((e) => e.category_id === categoryFilter)
    : expenses;

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Dépenses"
        description={`${expenses.length} dépense${expenses.length !== 1 ? "s" : ""}`}
        action={
          <Link to="/finance/expenses/new">
            <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
              Nouvelle dépense
            </Button>
          </Link>
        }
      />

      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSearchParams({})}
            className={[
              "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
              !categoryFilter
                ? "bg-zinc-950 text-white border-zinc-950"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400",
            ].join(" ")}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.id })}
              className={[
                "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                categoryFilter === cat.id
                  ? "bg-zinc-950 text-white border-zinc-950"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400",
              ].join(" ")}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MoneyRecive size={40} color="currentColor" variant="Bulk" />}
          title="Aucune dépense"
          description="Commencez à suivre vos dépenses pour mieux gérer votre budget."
          action={
            <Link to="/finance/expenses/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouvelle dépense
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card padding="none">
            <div className="divide-y divide-zinc-100">
              {filtered.map((expense) => (
                <Link
                  key={expense.id}
                  to={`/finance/expenses/${expense.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                      <MoneyRecive size={14} color="currentColor" className="text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{expense.description}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(expense.date)}
                        {expense.category?.name ? ` · ${expense.category.name}` : ""}
                        {expense.is_business ? " · Pro" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-600 shrink-0">
                    −{formatCurrency(expense.amount)}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
          <div className="mt-4 flex justify-end">
            <span className="text-sm text-zinc-500">
              Total :{" "}
              <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
