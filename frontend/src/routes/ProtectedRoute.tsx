import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Gate for authenticated-only pages. Shows nothing while the initial
 * /auth/me check is in flight to avoid a login-page flash for users
 * with a valid session cookie.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}
