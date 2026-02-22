import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import {
  Wallet,
  ReceiptText,
  Briefcase,
  TaskSquare,
  TrendUp,
  ArrowRight2,
  Add,
  People,
  MoneyRecive,
} from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getFinanceSummary } from "~/lib/utils/finance";
import { getProjects } from "~/lib/queries/projects";
import { getInvoices } from "~/lib/queries/invoices";
import { getTasks } from "~/lib/queries/tasks";
import { StatCard } from "~/components/ui/StatCard";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/layout/PageHeader";
import { formatDate } from "~/lib/utils/dates";
import {
  PROJECT_STATUS_BADGE,
  PROJECT_STATUS_LABEL,
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_LABEL,
} from "~/lib/constants";
import { useCurrency } from "~/lib/context/currency";

export const meta: MetaFunction = () => [{ title: "Tableau de bord — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [finance, projects, invoices, tasks] = await Promise.all([
    getFinanceSummary(user.id),
    getProjects(user.id, { status: "active" }),
    getInvoices(user.id),
    getTasks(user.id, { status: "in_progress" }),
  ]);

  return {
    user,
    finance,
    activeProjects: projects.slice(0, 4),
    recentInvoices: invoices.slice(0, 5),
    activeTasks: tasks.slice(0, 5),
  };
}

export default function Dashboard() {
  const { user, finance, activeProjects, recentInvoices, activeTasks } =
    useLoaderData<typeof loader>();
  const { formatCurrency } = useCurrency();

  const firstName = user.email?.split("@")[0] ?? "Vous";

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${firstName} 👋`}
        description="Voici un aperçu de votre activité freelance"
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/clients/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <People size={14} color="currentColor" />
              Client
            </Link>
            <Link
              to="/invoices/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Add size={14} color="currentColor" />
              Facture
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenus réalisés"
          value={formatCurrency(finance.paidRevenue)}
          trend="up"
          trendLabel="Factures payées"
          icon={<TrendUp size={20} color="currentColor" />}
          iconColor="text-emerald-600"
        />
        <StatCard
          label="En attente"
          value={formatCurrency(finance.pendingRevenue)}
          trend="neutral"
          trendLabel="Factures envoyées"
          icon={<ReceiptText size={20} color="currentColor" />}
          iconColor="text-amber-600"
        />
        <StatCard
          label="Solde net"
          value={formatCurrency(finance.netBalance)}
          trend={finance.netBalance >= 0 ? "up" : "down"}
          trendLabel="Revenus − Dépenses"
          icon={<Wallet size={20} color="currentColor" />}
          iconColor="text-blue-600"
        />
        <StatCard
          label="Dépenses"
          value={formatCurrency(finance.totalExpenses)}
          trend="down"
          trendLabel="Total dépensé"
          icon={<MoneyRecive size={20} color="currentColor" />}
          iconColor="text-red-500"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projets actifs */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">Projets actifs</h2>
            <Link
              to="/projects"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Voir tout
              <ArrowRight2 size={12} color="currentColor" />
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="p-3 bg-zinc-100 rounded-xl">
                  <Briefcase size={24} color="currentColor" className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700">Aucun projet actif</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Créez votre premier projet</p>
                </div>
                <Link to="/projects/new" className="text-xs font-medium text-zinc-950 hover:underline">
                  + Nouveau projet
                </Link>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {activeProjects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <Card padding="md" hoverable>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{project.name}</p>
                        {project.client && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">
                            {project.client.company ?? project.client.name}
                          </p>
                        )}
                      </div>
                      <Badge variant={PROJECT_STATUS_BADGE[project.status]} size="sm">
                        {PROJECT_STATUS_LABEL[project.status]}
                      </Badge>
                    </div>
                    {(project.fixed_price ?? project.budget) ? (
                      <p className="text-xs text-zinc-500 mt-2">
                        {formatCurrency(project.fixed_price ?? project.budget ?? 0)}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              ))}
              {activeProjects.length === 4 && (
                <Link to="/projects" className="text-xs text-center text-zinc-400 hover:text-zinc-700 py-1 transition-colors">
                  Voir tous les projets →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Factures récentes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">Factures récentes</h2>
            <Link
              to="/invoices"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Voir tout
              <ArrowRight2 size={12} color="currentColor" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="p-3 bg-zinc-100 rounded-xl">
                  <ReceiptText size={24} color="currentColor" className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700">Aucune facture</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Créez votre première facture</p>
                </div>
                <Link to="/invoices/new" className="text-xs font-medium text-zinc-950 hover:underline">
                  + Nouvelle facture
                </Link>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-zinc-100">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        <ReceiptText size={14} color="currentColor" className="text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{invoice.invoice_number}</p>
                        <p className="text-xs text-zinc-400 truncate">
                          {invoice.client?.name ?? "—"}{" "}
                          {invoice.due_date && `· Échéance ${formatDate(invoice.due_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={INVOICE_STATUS_BADGE[invoice.status]} size="sm">
                        {INVOICE_STATUS_LABEL[invoice.status]}
                      </Badge>
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Tâches en cours */}
          {activeTasks.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-zinc-900">Tâches en cours</h2>
                <Link
                  to="/tasks"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Voir tout
                  <ArrowRight2 size={12} color="currentColor" />
                </Link>
              </div>
              <Card padding="none">
                <div className="divide-y divide-zinc-100">
                  {activeTasks.map((task) => (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                          <TaskSquare size={14} color="currentColor" className="text-zinc-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
                          {task.project && (
                            <p className="text-xs text-zinc-400">{task.project.name}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={TASK_PRIORITY_BADGE[task.priority]} size="sm">
                        {TASK_PRIORITY_LABEL[task.priority]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
