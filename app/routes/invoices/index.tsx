import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { ReceiptText, Add } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getInvoices } from "~/lib/queries/invoices";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { formatCurrency } from "~/lib/utils/currency";
import { formatDate } from "~/lib/utils/dates";
import { INVOICE_STATUS_BADGE, INVOICE_STATUS_LABEL } from "~/lib/constants";
import type { InvoiceStatus } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Factures — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const invoices = await getInvoices(user.id);
  return { invoices };
}

const STATUS_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "Toutes", value: "all" },
  { label: "Brouillons", value: "draft" },
  { label: "Envoyées", value: "sent" },
  { label: "Payées", value: "paid" },
  { label: "En retard", value: "overdue" },
];

export default function InvoicesIndex() {
  const { invoices } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = (searchParams.get("status") ?? "all") as InvoiceStatus | "all";

  const filtered =
    activeStatus === "all" ? invoices : invoices.filter((i) => i.status === activeStatus);

  const totalAmount = filtered.reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <PageHeader
        title="Factures"
        description={`${invoices.length} facture${invoices.length !== 1 ? "s" : ""}`}
        action={
          <Link to="/invoices/new">
            <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
              Nouvelle facture
            </Button>
          </Link>
        }
      />

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-zinc-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              setSearchParams(tab.value === "all" ? {} : { status: tab.value })
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
              (
              {tab.value === "all"
                ? invoices.length
                : invoices.filter((i) => i.status === tab.value).length}
              )
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={40} color="currentColor" variant="Bulk" />}
          title="Aucune facture"
          description="Créez votre première facture pour commencer à facturer vos clients."
          action={
            <Link to="/invoices/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouvelle facture
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card padding="none">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <span>Numéro</span>
              <span>Client</span>
              <span className="text-right hidden md:block">Montant</span>
              <span className="text-right hidden sm:block">Échéance</span>
              <span>Statut</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {filtered.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-900">{invoice.invoice_number}</span>
                  <span className="text-sm text-zinc-600 truncate">{invoice.client?.name ?? "—"}</span>
                  <span className="text-sm font-semibold text-zinc-900 text-right hidden md:block">
                    {formatCurrency(invoice.total)}
                  </span>
                  <span className="text-xs text-zinc-400 text-right hidden sm:block">
                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                  </span>
                  <Badge variant={INVOICE_STATUS_BADGE[invoice.status]} size="sm">
                    {INVOICE_STATUS_LABEL[invoice.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>

          {/* Summary */}
          <div className="mt-4 flex justify-end">
            <div className="text-sm text-zinc-500">
              Total affiché :{" "}
              <span className="font-semibold text-zinc-900">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
