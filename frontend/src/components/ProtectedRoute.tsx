import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type UserRole = "ADMIN" | "STUDENT";

interface ProtectedRouteProps {
  allowedRole: UserRole;
  children: ReactNode;
}

export default function ProtectedRoute({
  allowedRole,
  children,
}: ProtectedRouteProps) {
  const token = localStorage.getItem("certichain_token");
  const role = localStorage.getItem("certichain_role");

  // Not logged in
  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // Logged in with the wrong role
  if (role !== allowedRole) {
    if (role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "STUDENT") {
      return <Navigate to="/student/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}