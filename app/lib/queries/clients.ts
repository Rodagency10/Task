import { supabase } from "~/lib/supabase";
import type { Client } from "~/lib/types";

export async function getClients(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getClient(id: string, userId: string): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createClient(
  userId: string,
  payload: Omit<Client, "id" | "user_id" | "created_at">,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateClient(
  id: string,
  userId: string,
  payload: Partial<Omit<Client, "id" | "user_id" | "created_at">>,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteClient(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
