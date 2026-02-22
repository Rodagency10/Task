import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { Briefcase, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getProjects } from "~/lib/queries/projects";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { PeriodFilter, filterByPeriod, type PeriodKey } from "~/components/ui/PeriodFilter";
import { formatDate } from "~/lib/utils/dates";
import {
  PROJECT_STATUS_BADGE,
  PROJECT_STATUS_LABEL,
} from "~/lib/constants";
import type { ProjectStatus } from "~/lib/types";
import { useCurrency } from "~/lib/context/currency";

export const meta: MetaFunction = () => [{ title: "Projets — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const projects = await getProjects(user.id);
  return { projects };
}

const STATUS_TABS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Actifs", value: "active" },
  { label: "Brouillons", value: "draft" },
  { label: "Pausés", value: "paused" },
  { label: "Terminés", value: "completed" },
];

export default function ProjectsIndex() {
  const { projects } = useLoaderData<typeof loader>();
  const { formatCurrency } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = (searchParams.get("status") ?? "all") as ProjectStatus | "all";
  const period = (searchParams.get("period") ?? "all") as PeriodKey;

  const byStatus =
    activeStatus === "all" ? projects : projects.filter((p) => p.status === activeStatus);
  const filtered = filterByPeriod(byStatus, period, (p) => p.start_date ?? p.created_at);

  return (
    <div>
      <PageHeader
        title="Projets"
        description={`${projects.length} projet${projects.length !== 1 ? "s" : ""}`}
        action={
          <Link to="/projects/new">
            <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
              Nouveau projet
            </Button>
          </Link>
        }
      />

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-zinc-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              setSearchParams((p) => {
                if (tab.value === "all") p.delete("status");
                else p.set("status", tab.value);
                return p;
              })
            }
            className={[
              "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
              activeStatus === tab.value
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-700",
            ].join(" ")}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-zinc-400">
              ({tab.value === "all" ? projects.length : projects.filter((p) => p.status === tab.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Period filter */}
      <PeriodFilter className="mb-6" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={40} color="currentColor" variant="Bulk" />}
          title="Aucun projet"
          description="Créez votre premier projet pour commencer à suivre vos travaux."
          action={
            <Link to="/projects/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouveau projet
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card padding="lg" hoverable>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{project.name}</p>
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

                {project.description && (
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400">
                    {project.start_date ? formatDate(project.start_date) : "Pas de date"}
                  </span>
                  {(project.fixed_price ?? project.budget) ? (
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(project.fixed_price ?? project.budget ?? 0)}
                    </span>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
