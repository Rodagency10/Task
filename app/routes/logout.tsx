import { redirect, type ActionFunctionArgs } from "react-router";
import { supabase } from "~/lib/supabase";

export async function action(_: ActionFunctionArgs) {
  await supabase.auth.signOut();
  throw redirect("/login");
}
