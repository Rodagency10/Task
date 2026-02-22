import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import { HambergerMenu } from "iconsax-react";
import { Sidebar } from "~/components/layout/Sidebar";
import { Toaster } from "~/components/ui/Toaster";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { CurrencyProvider } from "~/lib/context/currency";
import { ToastProvider } from "~/lib/context/toast";
import { ConfirmProvider } from "~/lib/context/confirm";
import { supabase } from "~/lib/supabase";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  return { user };
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CurrencyProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div className="flex min-h-screen bg-zinc-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Mobile header */}
              <header className="mobile-header lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-30 no-print">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
                  aria-label="Ouvrir le menu"
                >
                  <HambergerMenu size={20} color="currentColor" />
                </button>
                <span className="font-bold text-zinc-950 text-base">Task</span>
              </header>

              <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>

          {/* Global overlays */}
          <Toaster />
          <ConfirmDialog />
        </ConfirmProvider>
      </ToastProvider>
    </CurrencyProvider>
  );
}
