import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

/**
 * Shared authenticated-app frame: sidebar (desktop) + navbar + routed page
 * content + bottom nav (mobile). Rendered as the parent of all protected
 * routes in AppRoutes so it isn't remounted on navigation.
 */
export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-surface-dark">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
