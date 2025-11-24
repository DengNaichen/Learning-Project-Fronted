import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 认证状态加载中，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-text-secondary dark:text-text-secondary-dark">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
