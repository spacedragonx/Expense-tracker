import { useState } from "react";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import QuickAddMenu from "./QuickAddMenu";

/** Top navbar: quick-add menu, notifications, and profile menu. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100/80 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 md:px-6">
      <div />
      <div className="flex items-center gap-3">
        <QuickAddMenu />

        <button
          className="rounded-xl p-2 text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-500">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-soft dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
