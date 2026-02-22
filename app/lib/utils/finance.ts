import { supabase } from "~/lib/supabase";
import type { FinanceSummary } from "~/lib/types";

interface Period {
  start: string;
  end: string;
}

/** Revenus réalisés — factures payées */
export async function getPaidRevenue(
  userId: string,
  period?: Period,
): Promise<number> {
  let query = supabase
    .from("invoices")
    .select("total")
    .eq("user_id", userId)
    .eq("status", "paid");

  if (period) {
    query = query.gte("issue_date", period.start).lte("issue_date", period.end);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.reduce((sum, inv) => sum + inv.total, 0);
}

/** Revenus en attente — factures envoyées non payées */
export async function getPendingRevenue(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("invoices")
    .select("total")
    .eq("user_id", userId)
    .eq("status", "sent");

  if (error) throw new Error(error.message);
  return data.reduce((sum, inv) => sum + inv.total, 0);
}

/** Revenus projetés — projets actifs/brouillons non encore facturés */
export async function getProjectedRevenue(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("projects")
    .select("fixed_price, budget")
    .eq("user_id", userId)
    .in("status", ["active", "draft"]);

  if (error) throw new Error(error.message);
  return data.reduce((sum, p) => sum + (p.fixed_price ?? p.budget ?? 0), 0);
}

/** Total des dépenses */
export async function getTotalExpenses(
  userId: string,
  period?: Period,
): Promise<number> {
  let query = supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId);

  if (period) {
    query = query.gte("date", period.start).lte("date", period.end);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.reduce((sum, e) => sum + e.amount, 0);
}

/** Revenus manuels (non liés à une facture) */
export async function getManualIncome(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("income")
    .select("amount")
    .eq("user_id", userId)
    .is("invoice_id", null);

  if (error) throw new Error(error.message);
  return data.reduce((sum, i) => sum + i.amount, 0);
}

/** Total des dettes actives (montant restant dû) */
export async function getPendingDebts(userId: string): Promise<{ total: number; pending: number }> {
  const { data, error } = await supabase
    .from("debts")
    .select("amount, amount_paid, status")
    .eq("user_id", userId)
    .neq("status", "cancelled");

  if (error) throw new Error(error.message);

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const pending = data.reduce((sum, d) => sum + Math.max(d.amount - d.amount_paid, 0), 0);
  return { total, pending };
}

/** Résumé complet pour le dashboard finances */
export async function getFinanceSummary(userId: string): Promise<FinanceSummary> {
  const [paidRevenue, pendingRevenue, projectedRevenue, totalExpenses, manualIncome, debts] =
    await Promise.all([
      getPaidRevenue(userId),
      getPendingRevenue(userId),
      getProjectedRevenue(userId),
      getTotalExpenses(userId),
      getManualIncome(userId),
      getPendingDebts(userId),
    ]);

  return {
    paidRevenue,
    pendingRevenue,
    projectedRevenue,
    totalExpenses,
    netBalance: paidRevenue + manualIncome - totalExpenses,
    totalDebts: debts.total,
    pendingDebts: debts.pending,
  };
}

/** Calcule le statut d'une dette après paiement */
export function computeDebtStatus(amount: number, amountPaid: number) {
  if (amountPaid >= amount) return "paid" as const;
  if (amountPaid > 0) return "partial" as const;
  return "pending" as const;
}
