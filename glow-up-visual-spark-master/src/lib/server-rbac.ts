import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/contexts/auth-context';

/**
 * Get user roles from the server
 * @param userId - The user ID to get roles for
 * @returns Promise<string[]> - Array of role names
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = createClient();
  
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', userId);
    
  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return (roles || []).map(r => r.role as UserRole);
}

/**
 * Check if a user has any of the required roles (server-side)
 * @param userId - The user ID to check
 * @param requiredRoles - Single role or array of roles to check against
 * @returns Promise<boolean> - True if user has any of the required roles
 */
export async function checkUserRole(
  userId: string,
  requiredRoles: UserRole | UserRole[]
): Promise<boolean> {
  if (!userId) return false;
  
  const userRoles = await getUserRoles(userId);
  const requiredRolesArray = Array.isArray(requiredRoles) 
    ? requiredRoles 
    : [requiredRoles];
    
  return requiredRolesArray.some(role => userRoles.includes(role));
}

/**
 * Middleware for protecting API routes with role-based access control
 * @param handler - The API route handler
 * @param requiredRoles - Required roles to access the route
 * @returns API route handler with role-based access control
 */
export function withRoleAuth(
  handler: (req: Request, userId: string) => Promise<Response>,
  requiredRoles: UserRole | UserRole[]
) {
  return async (req: Request) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const hasRequiredRole = await checkUserRole(session.user.id, requiredRoles);
      
      if (!hasRequiredRole) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return handler(req, session.user.id);
    } catch (error) {
      console.error('Role-based auth error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Server component wrapper for role-based access control
 * @param Component - The component to render if user has required roles
 * @param requiredRoles - Required roles to access the component
 * @param FallbackComponent - Component to render if user doesn't have required roles
 * @returns A component with role-based access control
 */
export function withServerRoleAuth<
  T extends { userId: string },
  P = {}
>(
  Component: React.ComponentType<T>,
  requiredRoles: UserRole | UserRole[],
  FallbackComponent: React.ComponentType<P> = () => null
) {
  return async function ServerRoleWrapper(props: Omit<T, 'userId'> & { userId: string }) {
    const hasRequiredRole = await checkUserRole(props.userId, requiredRoles);
    
    if (!hasRequiredRole) {
      // @ts-ignore - TypeScript doesn't like the spread here but it's safe
      return <FallbackComponent {...props as unknown as P} />;
    }
    
    // @ts-ignore - TypeScript doesn't like the spread here but it's safe
    return <Component {...props} />;
  };
}
