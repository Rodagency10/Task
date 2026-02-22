import { supabase } from "~/lib/supabase";
import type { Expense, ExpenseWithCategory, ExpenseCategory } from "~/lib/types";

export async function getExpenses(
  userId: string,
  filters?: { categoryId?: string; isBusiness?: boolean },
): Promise<ExpenseWithCategory[]> {
  let query = supabase
    .from("expenses")
    .select("*, category:expense_categories(name, color, icon)")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.isBusiness !== undefined) query = query.eq("is_business", filters.isBusiness);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as ExpenseWithCategory[];
}

export async function getExpense(
  id: string,
  userId: string,
): Promise<ExpenseWithCategory> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, category:expense_categories(name, color, icon)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as ExpenseWithCategory;
}

export async function getExpenseCategories(
  userId: string,
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createExpense(
  userId: string,
  payload: Omit<Expense, "id" | "user_id" | "created_at">,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateExpense(
  id: string,
  userId: string,
  payload: Partial<Omit<Expense, "id" | "user_id" | "created_at">>,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteExpense(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
