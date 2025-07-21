import { UserRole } from '@/contexts/auth-context';

type RoleHierarchy = {
  [key in UserRole]: UserRole[];
};

// Define role hierarchy (higher roles inherit permissions from lower roles)
const ROLE_HIERARCHY: RoleHierarchy = {
  admin: ['admin', 'viewer', 'donor', 'member'],
  viewer: ['viewer'],
  donor: ['donor', 'member'], // Example: donors can also have member permissions
  member: ['member'],
};

/**
 * Check if a user has a specific role or any of the specified roles
 * @param userRoles - Array of user's roles
 * @param requiredRoles - Single role or array of roles to check against
 * @returns boolean - True if user has any of the required roles or inherits from them
 */
export function hasRole(
  userRoles: UserRole[] = [],
  requiredRoles: UserRole | UserRole[]
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  const requiredRolesArray = Array.isArray(requiredRoles) 
    ? requiredRoles 
    : [requiredRoles];

  return requiredRolesArray.some(requiredRole => {
    // If user has the exact role, return true
    if (userRoles.includes(requiredRole)) return true;
    
    // Check role hierarchy
    const inheritedRoles = ROLE_HIERARCHY[requiredRole] || [];
    return userRoles.some(role => inheritedRoles.includes(role));
  });
}

/**
 * Check if a user has all of the specified roles
 * @param userRoles - Array of user's roles
 * @param requiredRoles - Array of roles that the user must have
 * @returns boolean - True if user has all required roles
 */
export function hasAllRoles(
  userRoles: UserRole[] = [],
  requiredRoles: UserRole[]
): boolean {
  if (!userRoles || userRoles.length === 0 || !requiredRoles || requiredRoles.length === 0) {
    return false;
  }
  
  return requiredRoles.every(requiredRole => 
    userRoles.includes(requiredRole) || 
    (ROLE_HIERARCHY[requiredRole] || []).some(role => userRoles.includes(role))
  );
}

/**
 * Get the highest role from a user's roles based on the hierarchy
 * @param userRoles - Array of user's roles
 * @returns UserRole | undefined - The highest role or undefined if no roles
 */
export function getHighestRole(userRoles: UserRole[] = []): UserRole | undefined {
  if (!userRoles || userRoles.length === 0) return undefined;
  
  // Check roles in order of hierarchy (admin first)
  const roleOrder: UserRole[] = ['admin', 'donor', 'member', 'viewer'];
  
  for (const role of roleOrder) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  
  return userRoles[0]; // Fallback to first role if not in our hierarchy
}

/**
 * Check if a user has permission to access a specific route or feature
 * @param userRoles - Array of user's roles
 * @param requiredPermission - The required permission level
 * @returns boolean - True if user has the required permission
 */
export function hasPermission(
  userRoles: UserRole[] = [],
  requiredPermission: 'view' | 'edit' | 'admin'
): boolean {
  const rolePermissions: Record<UserRole, ('view' | 'edit' | 'admin')[]> = {
    admin: ['view', 'edit', 'admin'],
    donor: ['view', 'edit'],
    member: ['view', 'edit'],
    viewer: ['view'],
  };

  return userRoles.some(role => 
    rolePermissions[role]?.includes(requiredPermission)
  );
}

/**
 * Filter items based on user's roles
 * @param items - Array of items to filter
 * @param userRoles - Array of user's roles
 * @param roleField - The field in the item that contains the required role
 * @returns Filtered array of items that the user has access to
 */
export function filterByRole<T>(
  items: T[], 
  userRoles: UserRole[], 
  roleField: keyof T
): T[] {
  if (!userRoles || userRoles.length === 0) return [];
  
  return items.filter(item => {
    const itemRole = item[roleField];
    if (typeof itemRole === 'string') {
      return hasRole(userRoles, itemRole as UserRole);
    } else if (Array.isArray(itemRole)) {
      return (itemRole as UserRole[]).some(role => hasRole(userRoles, role));
    }
    return false;
  });
}
