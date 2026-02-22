import { supabase } from "~/lib/supabase";
import type { TimeEntry, TimeEntryWithProject } from "~/lib/types";

export async function getTimeEntries(
  userId: string,
  filters?: { projectId?: string; taskId?: string },
): Promise<TimeEntryWithProject[]> {
  let query = supabase
    .from("time_entries")
    .select("*, project:projects(id, name), task:tasks(id, title)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.taskId) query = query.eq("task_id", filters.taskId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as TimeEntryWithProject[];
}

export async function createTimeEntry(
  userId: string,
  payload: Omit<TimeEntry, "id" | "user_id" | "created_at">,
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function stopTimer(
  id: string,
  userId: string,
  endedAt: string,
): Promise<TimeEntry> {
  const entry = await supabase
    .from("time_entries")
    .select("started_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (entry.error) throw new Error(entry.error.message);

  const durationMs = new Date(endedAt).getTime() - new Date(entry.data.started_at).getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const { data, error } = await supabase
    .from("time_entries")
    .update({ ended_at: endedAt, duration_minutes: durationMinutes })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTimeEntry(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
