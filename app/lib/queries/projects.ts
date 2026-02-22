import { supabase } from "~/lib/supabase";
import type { Project, ProjectWithClient, ProjectStatus } from "~/lib/types";

export async function getProjects(
  userId: string,
  filters?: { status?: ProjectStatus },
): Promise<ProjectWithClient[]> {
  let query = supabase
    .from("projects")
    .select("*, client:clients(id, name, company)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as ProjectWithClient[];
}

export async function getProject(
  id: string,
  userId: string,
): Promise<ProjectWithClient> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(id, name, company)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as ProjectWithClient;
}

export async function createProject(
  userId: string,
  payload: Omit<Project, "id" | "user_id" | "created_at">,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProject(
  id: string,
  userId: string,
  payload: Partial<Omit<Project, "id" | "user_id" | "created_at">>,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProject(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
