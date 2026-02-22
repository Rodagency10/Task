import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, Link, useFetcher } from "react-router";
import { ArrowLeft, Trash, Send2, TickCircle, CloseCircle } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getInvoice, updateInvoiceStatus, deleteInvoice } from "~/lib/queries/invoices";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { formatCurrency } from "~/lib/utils/currency";
import { formatDate } from "~/lib/utils/dates";
import { INVOICE_STATUS_BADGE, INVOICE_STATUS_LABEL } from "~/lib/constants";
import type { InvoiceStatus } from "~/lib/types";

export const meta: MetaFunction = () => [{ title: "Facture — Task" }];

export async function loader({ params }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const invoice = await getInvoice(params.invoiceId!, user.id);
  return { invoice };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    await deleteInvoice(params.invoiceId!, user.id);
    throw redirect("/invoices");
  }

  if (intent === "update_status") {
    const newStatus = formData.get("status") as InvoiceStatus;
    await updateInvoiceStatus(params.invoiceId!, user.id, newStatus);
    return { success: true };
  }

  return {};
}

const STATUS_ACTIONS: {
  from: InvoiceStatus[];
  to: InvoiceStatus;
  label: string;
  icon: typeof Send2;
  variant: "primary" | "secondary" | "danger";
}[] = [
  {
    from: ["draft"],
    to: "sent",
    label: "Marquer comme envoyée",
    icon: Send2,
    variant: "primary",
  },
  {
    from: ["sent", "overdue"],
    to: "paid",
    label: "Marquer comme payée",
    icon: TickCircle,
    variant: "primary",
  },
  {
    from: ["draft", "sent", "overdue"],
    to: "cancelled",
    label: "Annuler",
    icon: CloseCircle,
    variant: "danger",
  },
];

export default function InvoiceDetail() {
  const { invoice } = useLoaderData<typeof loader>();

  const availableActions = STATUS_ACTIONS.filter((a) =>
    a.from.includes(invoice.status),
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/invoices"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} color="currentColor" />
          Factures
        </Link>
      </div>

      <PageHeader
        title={invoice.invoice_number}
        description={invoice.client?.name ?? "Facture"}
        action={
          <div className="flex items-center gap-2">
            {availableActions.map((action) => {
              const Icon = action.icon;
              return (
                <Form key={action.to} method="post">
                  <input type="hidden" name="intent" value="update_status" />
                  <input type="hidden" name="status" value={action.to} />
                  <Button
                    type="submit"
                    variant={action.variant}
                    size="sm"
                    leftIcon={<Icon size={14} color="currentColor" />}
                  >
                    {action.label}
                  </Button>
                </Form>
              );
            })}
            {invoice.status !== "paid" && (
              <Form
                method="post"
                onSubmit={(e) => {
                  if (!confirm("Supprimer cette facture ?")) e.preventDefault();
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
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice body */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            {/* Header info */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-2xl font-bold text-zinc-950">{invoice.invoice_number}</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Émise le {formatDate(invoice.issue_date)}
                </p>
              </div>
              <Badge variant={INVOICE_STATUS_BADGE[invoice.status]}>
                {INVOICE_STATUS_LABEL[invoice.status]}
              </Badge>
            </div>

            {/* Client */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                Facturé à
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {invoice.client?.name ?? "—"}
              </p>
              {invoice.client?.company && (
                <p className="text-sm text-zinc-500">{invoice.client.company}</p>
              )}
            </div>

            {/* Items */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-[1fr_60px_90px_90px] gap-3 pb-2 border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span>Description</span>
                  <span className="text-center">Qté</span>
                  <span className="text-right">Prix unit.</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="divide-y divide-zinc-50">
                  {invoice.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_60px_90px_90px] gap-3 py-3 text-sm"
                    >
                      <span className="text-zinc-700">{item.description}</span>
                      <span className="text-center text-zinc-600">{item.quantity}</span>
                      <span className="text-right text-zinc-600">
                        {formatCurrency(item.unit_price)}
                      </span>
                      <span className="text-right font-medium text-zinc-900">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="flex flex-col items-end gap-1.5 pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-8 text-sm text-zinc-600">
                <span>Sous-total</span>
                <span className="font-medium text-zinc-900 w-28 text-right">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex items-center gap-8 text-sm text-zinc-600">
                  <span>TVA ({invoice.tax_rate}%)</span>
                  <span className="font-medium text-zinc-900 w-28 text-right">
                    {formatCurrency(invoice.tax_amount)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-8 text-base font-bold text-zinc-950">
                <span>Total</span>
                <span className="w-28 text-right">{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 pt-4 border-t border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                  Notes
                </p>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
              Détails
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Statut</span>
                <Badge variant={INVOICE_STATUS_BADGE[invoice.status]} size="sm">
                  {INVOICE_STATUS_LABEL[invoice.status]}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Émise le</span>
                <span className="text-sm text-zinc-700">{formatDate(invoice.issue_date)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Échéance</span>
                  <span className="text-sm text-zinc-700">{formatDate(invoice.due_date)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-zinc-100 pt-3">
                <span className="text-sm font-semibold text-zinc-900">Total</span>
                <span className="text-base font-bold text-zinc-950">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </Card>

          {invoice.client && (
            <Card padding="md">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
                Client
              </h3>
              <Link
                to={`/clients/${invoice.client_id}`}
                className="text-sm font-medium text-zinc-900 hover:underline"
              >
                {invoice.client.name}
              </Link>
              {invoice.client.company && (
                <p className="text-xs text-zinc-400 mt-0.5">{invoice.client.company}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
