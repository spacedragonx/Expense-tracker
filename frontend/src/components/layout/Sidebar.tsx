import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
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
  Upload,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/analytics", label: "Analytics", icon: PieChart },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/expenses", label: "Expenses", icon: Receipt },
      { to: "/income", label: "Income", icon: Wallet },
      { to: "/budgets", label: "Budgets", icon: Landmark },
      { to: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Activity",
    items: [
      { to: "/calendar", label: "Calendar", icon: Calendar },
      { to: "/reports", label: "Reports", icon: FileText },
      { to: "/statement-import", label: "Import Statement", icon: Upload },
    ],
  },
];

/**
 * Collapsible desktop sidebar. Hidden below md breakpoint in favor of
 * MobileNav's bottom bar. Same routes/icons as before, grouped for a less
 * "admin template" feel per the redesign brief.
 */
export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-ash dark:md:border-slate-800 md:bg-ivory md:dark:bg-slate-900 md:min-h-screen">
      <div className="flex items-center justify-between px-5 py-5">
        <span className="text-lg font-display font-bold tracking-tight text-graphite dark:text-primary-500">
          Expense Tracker
        </span>
        <NavLink
          to="/settings"
          aria-label="Settings"
          title="Settings"
          className={({ isActive }) =>
            `rounded-md dark:rounded-xl p-2 transition-colors duration-150 ${
              isActive
                ? "bg-fog text-graphite dark:bg-primary-500/10 dark:text-primary-500"
                : "text-gray-500 hover:bg-fog dark:text-gray-300 dark:hover:bg-slate-800"
            }`
          }
        >
          <SettingsIcon size={18} />
        </NavLink>
      </div>

      <nav className="flex-1 space-y-5 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-md dark:rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "bg-fog text-graphite dark:bg-primary-500/10 dark:text-primary-500"
                        : "text-gray-600 hover:bg-fog dark:text-gray-300 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 h-4 w-0.5 rounded-full bg-ember dark:bg-primary-500"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="transition-transform duration-150 group-hover:scale-105" />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
