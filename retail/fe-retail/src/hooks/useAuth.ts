import { useAppSelector } from "./redux";

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);

  const hasRole = (role: string): boolean => {
    return auth.user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return auth.user ? roles.includes(auth.user.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole("admin");
  };

  const isStaff = (): boolean => {
    return hasRole("staff");
  };

  const canAccess = (requiredRoles: readonly string[]): boolean => {
    return hasAnyRole([...requiredRoles]);
  };

  return {
    ...auth,
    hasRole,
    hasAnyRole,
    isAdmin,
    isStaff,
    canAccess,
  };
};
