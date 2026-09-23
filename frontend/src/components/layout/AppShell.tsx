import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

/**
 * Shared authenticated-app frame: sidebar (desktop) + navbar + routed page
 * content + bottom nav (mobile). Rendered as the parent of all protected
 * routes in AppRoutes so it isn't remounted on navigation.
 */
export default function AppShell() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen bg-fog dark:bg-[#0b1220]">
      {/* Extremely subtle ambient depth behind the whole app frame — kept faint so the UI stays minimalist. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(255,104,44,0.03),transparent_55%)] dark:bg-[radial-gradient(900px_circle_at_20%_-10%,rgb(16_185_129/0.09),transparent_55%)]" />
      <Sidebar />
      <div className="relative flex flex-1 flex-col">
        <Navbar />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      <MobileNav />
    </div>
  );
}
