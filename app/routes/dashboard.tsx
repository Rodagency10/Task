import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { supabase } from "~/lib/supabase";
import { PageHeader } from "~/components/layout/PageHeader";

export const meta: MetaFunction = () => [{ title: "Dashboard — Task" }];

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  return { user };
}

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de vos projets et finances"
      />
      <div className="flex items-center justify-center py-32 text-zinc-600 text-sm">
        Dashboard coming soon — Phase 5.1
      </div>
    </div>
  );
}
