import { supabase } from "~/lib/supabase";
import type { Debt, DebtWithPayments, DebtStatus } from "~/lib/types";
import { computeDebtStatus } from "~/lib/utils/finance";

export async function getDebts(
  userId: string,
  filters?: { status?: DebtStatus },
): Promise<DebtWithPayments[]> {
  let query = supabase
    .from("debts")
    .select("*, payments:debt_payments(*)")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .order("due_date", { ascending: true });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as DebtWithPayments[];
}

export async function getDebt(
  id: string,
  userId: string,
): Promise<DebtWithPayments> {
  const { data, error } = await supabase
    .from("debts")
    .select("*, payments:debt_payments(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as DebtWithPayments;
}

export async function createDebt(
  userId: string,
  payload: Omit<Debt, "id" | "user_id" | "created_at" | "amount_paid" | "status">,
): Promise<Debt> {
  const { data, error } = await supabase
    .from("debts")
    .insert({ ...payload, user_id: userId, amount_paid: 0, status: "pending" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function recordDebtPayment(
  debtId: string,
  userId: string,
  amount: number,
  notes?: string,
): Promise<Debt> {
  // Récupérer la dette actuelle
  const { data: debt, error: fetchError } = await supabase
    .from("debts")
    .select("amount, amount_paid")
    .eq("id", debtId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const newAmountPaid = debt.amount_paid + amount;
  const newStatus = computeDebtStatus(debt.amount, newAmountPaid);

  // Enregistrer le paiement
  const { error: paymentError } = await supabase
    .from("debt_payments")
    .insert({ debt_id: debtId, amount, notes });

  if (paymentError) throw new Error(paymentError.message);

  // Mettre à jour la dette
  const { data, error } = await supabase
    .from("debts")
    .update({ amount_paid: newAmountPaid, status: newStatus })
    .eq("id", debtId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateDebt(
  id: string,
  userId: string,
  payload: Partial<Omit<Debt, "id" | "user_id" | "created_at">>,
): Promise<Debt> {
  const { data, error } = await supabase
    .from("debts")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function cancelDebt(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("debts")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
