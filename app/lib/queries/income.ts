import { supabase } from "~/lib/supabase";
import type { Income, IncomeWithInvoice } from "~/lib/types";

export async function getIncome(userId: string): Promise<IncomeWithInvoice[]> {
  const { data, error } = await supabase
    .from("income")
    .select("*, invoice:invoices(id, invoice_number)")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data as IncomeWithInvoice[];
}

export async function createIncome(
  userId: string,
  payload: Omit<Income, "id" | "user_id" | "created_at">,
): Promise<Income> {
  const { data, error } = await supabase
    .from("income")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateIncome(
  id: string,
  userId: string,
  payload: Partial<Omit<Income, "id" | "user_id" | "created_at">>,
): Promise<Income> {
  const { data, error } = await supabase
    .from("income")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteIncome(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("income")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
