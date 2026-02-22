import { NavLink, useNavigate } from "react-router";
import {
  Home2,
  People,
  Briefcase,
  TaskSquare,
  ReceiptText,
  Timer1,
  Wallet,
  MoneyRecive,
  MoneyForbidden,
  MoneySend,
  LogoutCurve,
} from "iconsax-react";
import { NAV_SECTIONS } from "~/lib/constants";
import { useCurrency, CURRENCIES, type CurrencyCode } from "~/lib/context/currency";
import { supabase } from "~/lib/supabase";

const ICON_MAP = {
  Home2,
  People,
  Briefcase,
  TaskSquare,
  ReceiptText,
  Timer1,
  Wallet,
  MoneyRecive,
  MoneyForbidden,
  MoneySend,
} as const;

type IconName = keyof typeof ICON_MAP;

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed lg:sticky top-0 z-50 lg:z-auto",
          "w-64 h-screen bg-white border-r border-zinc-200",
          "flex flex-col overflow-y-auto shrink-0",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "no-print",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-zinc-200">
          <span className="text-base font-bold text-zinc-950 tracking-tight">Task</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-3 mt-4 mb-1 first:mt-0">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = ICON_MAP[item.icon as IconName];
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {Icon && (
                          <Icon
                            size={18}
                            color="currentColor"
                            variant={isActive ? "Bulk" : "Linear"}
                          />
                        )}
                        {item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: currency selector + logout */}
        <div className="border-t border-zinc-200 px-3 py-3 flex flex-col gap-3">
          {/* Currency */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-1 mb-1.5">
              Devise
            </p>
            <div className="flex gap-1">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={[
                    "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                    currency === code
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogoutCurve size={16} color="currentColor" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
