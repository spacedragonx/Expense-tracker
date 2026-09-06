import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Target,
  Calendar,
  FileText,
  Settings as SettingsIcon,
  Landmark,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/budgets", label: "Budgets", icon: Landmark },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

/**
 * Collapsible desktop sidebar. Hidden below md breakpoint in favor of
 * MobileNav's bottom bar.
 */
export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-gray-100 dark:md:border-slate-800 md:bg-white md:dark:bg-slate-900 md:min-h-screen">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold tracking-tight text-primary-700 dark:text-primary-500">
          Expense Tracker
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-500"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
