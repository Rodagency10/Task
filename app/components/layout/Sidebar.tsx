import { NavLink } from "react-router";
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
} from "iconsax-react";
import { NAV_SECTIONS } from "~/lib/constants";

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

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-zinc-200 h-screen sticky top-0 flex flex-col overflow-y-auto">
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
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
    </aside>
  );
}
