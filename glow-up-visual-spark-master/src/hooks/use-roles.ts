import { useAuth } from '@/contexts/auth-context';
import { hasRole, hasAllRoles, getHighestRole, hasPermission, filterByRole } from '@/lib/rbac';
import { UserRole } from '@/contexts/auth-context';

export function useRoles() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  return {
    /**
     * Check if the current user has any of the specified roles
     * @param requiredRoles - Single role or array of roles to check against
     * @returns boolean - True if user has any of the required roles
     */
    hasRole: (requiredRoles: UserRole | UserRole[]) => 
      hasRole(roles, requiredRoles),
    
    /**
     * Check if the current user has all of the specified roles
     * @param requiredRoles - Array of roles that the user must have
     * @returns boolean - True if user has all required roles
     */
    hasAllRoles: (requiredRoles: UserRole[]) => 
      hasAllRoles(roles, requiredRoles),
    
    /**
     * Get the highest role from the current user's roles
     * @returns UserRole | undefined - The highest role or undefined if no roles
     */
    getHighestRole: () => getHighestRole(roles),
    
    /**
     * Check if the current user has a specific permission level
     * @param permission - The required permission level
     * @returns boolean - True if user has the required permission
     */
    hasPermission: (permission: 'view' | 'edit' | 'admin') => 
      hasPermission(roles, permission),
    
    /**
     * Filter items based on the current user's roles
     * @param items - Array of items to filter
     * @param roleField - The field in the item that contains the required role
     * @returns Filtered array of items that the user has access to
     */
    filterByRole: <T>(items: T[], roleField: keyof T) => 
      filterByRole(items, roles, roleField),
    
    /**
     * Get all roles of the current user
     */
    roles,
    
    /**
     * Check if the current user is an admin
     */
    isAdmin: roles.includes('admin'),
    
    /**
     * Check if the current user is a donor
     */
    isDonor: roles.includes('donor'),
    
    /**
     * Check if the current user is a member
     */
    isMember: roles.includes('member'),
    
    /**
     * Check if the current user is a viewer
     */
    isViewer: roles.includes('viewer'),
    
    /**
     * Check if the current user is authenticated
     */
    isAuthenticated: !!user,
  };
}

/**
 * A higher-order component that conditionally renders children based on user roles
 */
export function withRole(
  Component: React.ComponentType,
  requiredRoles: UserRole | UserRole[],
  FallbackComponent: React.ComponentType = () => null
) {
  return function WithRoleWrapper(props: any) {
    const { hasRole } = useRoles();
    
    if (hasRole(requiredRoles)) {
      return <Component {...props} />;
    }
    
    return <FallbackComponent {...props} />;
  };
}

/**
 * A component that conditionally renders children based on user roles
 */
export function RoleGuard({
  children,
  requiredRoles,
  fallback = null,
}: {
  children: React.ReactNode;
  requiredRoles: UserRole | UserRole[];
  fallback?: React.ReactNode;
}) {
  const { hasRole } = useRoles();
  return <>{hasRole(requiredRoles) ? children : fallback}</>;
}
