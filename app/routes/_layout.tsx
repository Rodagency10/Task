import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import { Sidebar } from "~/components/layout/Sidebar";
import { supabase } from "~/lib/supabase";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  return { user };
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
