import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/NotFound";

// Route-level code splitting: a visitor to "/" downloads the landing page only,
// not the whole authenticated app (Recharts, motion, every page).
const Landing = lazy(() => import("@/pages/Landing"));
const AppShell = lazy(() => import("@/components/layout/AppShell"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Income = lazy(() => import("@/pages/Income"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Budgets = lazy(() => import("@/pages/Budgets"));
const Goals = lazy(() => import("@/pages/Goals"));
const CalendarView = lazy(() => import("@/pages/CalendarView"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const StatementImport = lazy(() => import("@/pages/StatementImport"));

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes, wrapped in the shared shell (sidebar/navbar) */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/income" element={<Income />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/statement-import" element={<StatementImport />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
