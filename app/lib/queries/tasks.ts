import { supabase } from "~/lib/supabase";
import type { Task, TaskWithProject, TaskStatus, TaskPriority } from "~/lib/types";

export async function getTasks(
  userId: string,
  filters?: { status?: TaskStatus; priority?: TaskPriority; projectId?: string },
): Promise<TaskWithProject[]> {
  let query = supabase
    .from("tasks")
    .select("*, project:projects(id, name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.projectId) query = query.eq("project_id", filters.projectId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as TaskWithProject[];
}

export async function getTask(id: string, userId: string): Promise<TaskWithProject> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, project:projects(id, name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as TaskWithProject;
}

export async function createTask(
  userId: string,
  payload: Omit<Task, "id" | "user_id" | "created_at">,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTask(
  id: string,
  userId: string,
  payload: Partial<Omit<Task, "id" | "user_id" | "created_at">>,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
