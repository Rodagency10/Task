import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useNavigation, useLoaderData } from "react-router";
import { useState } from "react";
import { Add, Trash } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { createInvoice } from "~/lib/queries/invoices";
import { getClients } from "~/lib/queries/clients";
import { getProjects } from "~/lib/queries/projects";
import { generateInvoiceNumber, calculateInvoiceTotals } from "~/lib/utils/invoice";
import { toISODate } from "~/lib/utils/dates";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { useCurrency } from "~/lib/context/currency";
import { formatAmount } from "~/lib/utils/currency";

export const meta: MetaFunction = () => [{ title: "Nouvelle facture — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [clients, projects, invoiceNumber] = await Promise.all([
    getClients(user.id),
    getProjects(user.id),
    generateInvoiceNumber(user.id),
  ]);

  return { clients, projects, invoiceNumber };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const clientId = formData.get("client_id") as string;
  if (!clientId) return { error: "Veuillez sélectionner un client." };
  const currency = (formData.get("currency") as string) || "EUR";

  const itemDescriptions = formData.getAll("item_description") as string[];
  const itemQuantities = formData.getAll("item_quantity") as string[];
  const itemUnitPrices = formData.getAll("item_unit_price") as string[];

  const items = itemDescriptions.map((desc, i) => {
    const quantity = parseFloat(itemQuantities[i]) || 1;
    const unit_price = parseFloat(itemUnitPrices[i]) || 0;
    return { description: desc, quantity, unit_price, total: quantity * unit_price };
  }).filter((item) => item.description.trim());

  if (items.length === 0) return { error: "Ajoutez au moins un article." };

  const taxRate = parseFloat(formData.get("tax_rate") as string) || 0;
  const { subtotal, taxAmount, total } = calculateInvoiceTotals(items, taxRate);

  try {
    const invoice = await createInvoice(
      user.id,
      {
        client_id: clientId,
        project_id: (formData.get("project_id") as string) || null,
        invoice_number: formData.get("invoice_number") as string,
        status: "draft",
        issue_date: (formData.get("issue_date") as string) || toISODate(),
        due_date:
          (formData.get("due_date") as string) ||
          toISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: (formData.get("notes") as string)?.trim() || null,
      },
      items,
    );
    throw redirect(`/invoices/${invoice.id}`);
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewInvoice() {
  const { clients, projects, invoiceNumber } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { currency } = useCurrency();

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);

  const { subtotal, taxAmount, total } = calculateInvoiceTotals(
    items.map((i) => ({ ...i, total: i.quantity * i.unit_price })),
    taxRate,
  );

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div>
      <PageHeader title="Nouvelle facture" description="Créez une nouvelle facture client" />

      <Form method="post" className="max-w-3xl">
        <input type="hidden" name="currency" value={currency} />
        {actionData?.error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {actionData.error}
          </div>
        )}

        {/* Header info */}
        <Card padding="lg" className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Client *" name="client_id">
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` (${c.company})` : ""}
                </option>
              ))}
            </Select>
            <Select label="Projet" name="project_id">
              <option value="">— Aucun projet —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Input
              label="Numéro de facture"
              name="invoice_number"
              defaultValue={invoiceNumber}
              required
            />
            <Input label="TVA (%)" name="tax_rate" type="number" min="0" max="100" step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
            <Input label="Date d'émission" name="issue_date" type="date" defaultValue={toISODate()} />
            <Input label="Date d'échéance" name="due_date" type="date" />
          </div>
        </Card>

        {/* Items */}
        <Card padding="lg" className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Articles</h2>

          <div className="flex flex-col gap-3">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_100px_80px] gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <span>Description</span>
              <span className="text-center">Qté</span>
              <span className="text-right">Prix unit.</span>
              <span className="text-right">Total</span>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_80px_100px_80px] gap-3 items-center">
                <input
                  type="text"
                  name="item_description"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Description du service..."
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <input
                  type="number"
                  name="item_quantity"
                  value={item.quantity}
                  min="0"
                  step="0.5"
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 text-center focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <input
                  type="number"
                  name="item_unit_price"
                  value={item.unit_price}
                  min="0"
                  step="0.01"
                  onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 text-right focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <div className="flex items-center justify-end gap-1">
                  <span className="text-sm font-medium text-zinc-900">
                    {formatAmount(item.quantity * item.unit_price, currency)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-1 text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <Trash size={14} color="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <Add size={14} color="currentColor" />
            Ajouter un article
          </button>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-8 text-sm text-zinc-600">
              <span>Sous-total</span>
              <span className="font-medium text-zinc-900 w-28 text-right">{formatAmount(subtotal, currency)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex items-center gap-8 text-sm text-zinc-600">
                <span>TVA ({taxRate}%)</span>
                <span className="font-medium text-zinc-900 w-28 text-right">{formatAmount(taxAmount, currency)}</span>
              </div>
            )}
            <div className="flex items-center gap-8 text-base font-bold text-zinc-950">
              <span>Total</span>
              <span className="w-28 text-right">{formatAmount(total, currency)}</span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card padding="lg" className="mb-6">
          <Textarea label="Notes" name="notes" placeholder="Conditions de paiement, mentions légales..." rows={3} />
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer la facture"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => history.back()}>
            Annuler
          </Button>
        </div>
      </Form>
    </div>
  );
}
