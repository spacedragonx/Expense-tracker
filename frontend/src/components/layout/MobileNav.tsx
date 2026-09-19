import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Wallet, PieChart, Target } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/goals", label: "Goals", icon: Target },
];

/**
 * Bottom navigation shown only on small screens, replacing the sidebar.
 */
export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-gray-100/80 bg-white/90 py-2 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors duration-150 ${
              isActive ? "text-primary-600 dark:text-primary-500" : "text-gray-500 dark:text-gray-400"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={`transition-transform duration-150 ${isActive ? "scale-110" : ""}`} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
