import { supabase } from "~/lib/supabase";
import type { Invoice, InvoiceWithItems, InvoiceWithClient, InvoiceStatus } from "~/lib/types";
import { isOverdue } from "~/lib/utils/dates";

export async function getInvoices(
  userId: string,
  filters?: { status?: InvoiceStatus },
): Promise<InvoiceWithClient[]> {
  let query = supabase
    .from("invoices")
    .select("*, client:clients(id, name, company)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Marquer automatiquement les factures expirées
  return (data as InvoiceWithClient[]).map((inv) => ({
    ...inv,
    status: isOverdue(inv.due_date, inv.status) ? "overdue" : inv.status,
  }));
}

export async function getInvoice(
  id: string,
  userId: string,
): Promise<InvoiceWithItems> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, client:clients(id, name, company), items:invoice_items(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as InvoiceWithItems;
}

export async function createInvoice(
  userId: string,
  invoice: Omit<Invoice, "id" | "user_id" | "created_at">,
  items: { description: string; quantity: number; unit_price: number; total: number }[],
): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...invoice, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(items.map((item) => ({ ...item, invoice_id: data.id })));

    if (itemsError) throw new Error(itemsError.message);
  }

  return data;
}

export async function updateInvoiceStatus(
  id: string,
  userId: string,
  newStatus: InvoiceStatus,
): Promise<Invoice> {
  // Récupérer l'état actuel pour détecter la transition vers "paid"
  const { data: current, error: fetchError } = await supabase
    .from("invoices")
    .select("status, invoice_number, total, client:clients(name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-sync invoice → income quand statut passe à "paid"
  if (newStatus === "paid" && current.status !== "paid") {
    const clientName = Array.isArray(current.client)
      ? current.client[0]?.name
      : (current.client as { name: string } | null)?.name ?? "Client";

    await supabase.from("income").insert({
      user_id: userId,
      source: `Facture ${current.invoice_number}`,
      description: `Paiement de ${clientName}`,
      amount: current.total,
      date: new Date().toISOString().split("T")[0],
      invoice_id: id,
    });
  }

  return data;
}

export async function deleteInvoice(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
