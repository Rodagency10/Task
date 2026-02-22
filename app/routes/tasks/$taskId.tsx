import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { supabase } from "~/lib/supabase";
import { PageHeader } from "~/components/layout/PageHeader";

export const meta: MetaFunction = () => [{ title: "Task — Task" }];

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  return { user };
}

export default function TaskDetail() {
  return (
    <div>
      <PageHeader title="Task" />
      <div className="flex items-center justify-center py-32 text-zinc-600 text-sm">
        Bientôt disponible
      </div>
    </div>
  );
}
