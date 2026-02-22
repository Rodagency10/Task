import { supabase } from "~/lib/supabase";

/**
 * Génère un numéro de facture unique au format INV-YYYY-NNNN
 * NNNN est séquentiel pour l'utilisateur courant sur l'année en cours.
 */
export async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("user_id", userId)
    .ilike("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].invoice_number.replace(prefix, ""), 10);
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Calcule les totaux d'une facture depuis ses lignes.
 */
export function calculateInvoiceTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate: number,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}
