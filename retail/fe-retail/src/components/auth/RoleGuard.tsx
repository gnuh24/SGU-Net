import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  children: React.ReactElement;
  allowedRoles: string[];
}

const RoleGuard: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to dashboard or show unauthorized
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleGuard;
