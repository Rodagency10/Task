import { supabase } from "~/lib/supabase";
import type { UserProfile } from "~/lib/types";

type ProfileData = Omit<UserProfile, "id" | "user_id" | "created_at" | "updated_at">;

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function upsertProfile(
  userId: string,
  data: Partial<ProfileData>,
): Promise<void> {
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
}
