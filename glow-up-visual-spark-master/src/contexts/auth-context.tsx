'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { User, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Import types
import { UserRole, UserRolesRecord, getRolesFromRecord } from '@/types';

// Initialize Supabase client
const supabase = getSupabaseClient();

// Extend the User type
export interface AppUser extends User {
  roles: UserRole[];
  full_name?: string;
  role?: UserRole; // Backward compatibility
  rolesRecord?: UserRolesRecord; // New denormalized roles
}

// Context type
interface SignUpResult {
  error: Error | null;
  user: User | null;
  isFirstUser: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  currentRole: UserRole | null;
  setCurrentRole: (role: UserRole | null) => void;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, initialRoles?: UserRole[]) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  switchRole: (role: UserRole) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const isMounted = useRef(true);
  const router = useRouter();

  // Fetch profile and roles with better error handling and retries
  const getProfileAndSetUser = useCallback(async (session: Session | null, attempt = 1) => {
    if (!session?.user) {
      if (isMounted.current) {
        setUser(null);
        setSession(null);
        setLoading(false);
      }
      return;
    }

    try {
      const supabase = getSupabaseClient();

      // Try to get the user's profile (only basic info, roles are handled separately)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .single();

      // Don't throw if profile doesn't exist, we'll create it with default values
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Profile fetch error (non-fatal):', profileError);
      }

      // Fetch user roles using the denormalized table
      let roles: UserRole[] = ['viewer']; // Default role
      try {
        const { data: rolesRecord, error: rolesError } = await supabase
          .from('user_roles_denorm')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          
          // If the denormalized record doesn't exist yet, create it with default viewer role
          if (rolesError.code === 'PGRST116') { // No rows found
            console.log('No roles record found, creating default viewer role');
            const { error: createError } = await supabase
              .from('user_roles_denorm')
              .insert([{ 
                user_id: session.user.id,
                is_viewer: true,
                is_admin: false,
                is_clerk: false,
                is_donor: false,
                is_member: false
              }]);
              
            if (createError) {
              console.error('Error creating default role record:', createError);
            } else {
              roles = ['viewer'];
            }
          }
        } else if (rolesRecord) {
          // Convert the roles record to an array of role strings
          roles = [];
          if (rolesRecord.is_admin) roles.push('admin');
          if (rolesRecord.is_viewer) roles.push('viewer');
          if (rolesRecord.is_clerk) roles.push('clerk');
          if (rolesRecord.is_donor) roles.push('donor');
          if (rolesRecord.is_member) roles.push('member');
          
          if (roles.length === 0) {
            console.log('No roles enabled, defaulting to viewer');
            roles = ['viewer'];
          }
        }
      } catch (err) {
        console.error('Exception when fetching roles:', err);
      }

      // Get user's display name from various sources
      const full_name = profile?.full_name || 
                       session.user.user_metadata?.full_name || 
                       session.user.email?.split('@')[0] || 
                       'User';
      
      // Ensure we have a profile record
      if (!profile) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            id: session.user.id,
            full_name,
            avatar_url: session.user.user_metadata?.avatar_url || null
          }]);
          
        if (createError) {
          console.error('Error creating profile:', createError);
        }
      }

      if (isMounted.current) {
        const userRoles: UserRole[] = (roles.length > 0 ? roles : ['viewer']) as UserRole[];
        const newUser: AppUser = { 
          ...session.user,
          id: session.user.id,
          app_metadata: session.user.app_metadata,
          user_metadata: session.user.user_metadata,
          aud: session.user.aud,
          created_at: session.user.created_at,
          roles: userRoles, 
          role: userRoles[0],
          full_name 
        };
        
        setUser(newUser);
        setSession(session);
        
        // Set current role from localStorage or default to first role
        const savedRole = typeof window !== 'undefined' ? localStorage.getItem('currentRole') as UserRole : null;
        const defaultRole = savedRole && userRoles.includes(savedRole) ? savedRole : userRoles[0];
        setCurrentRole(defaultRole);
        
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in getProfileAndSetUser:', err);
      if (attempt < 3) {
        setTimeout(() => getProfileAndSetUser(session, attempt + 1), 1000);
      } else if (isMounted.current) {
        setUser({ 
          ...session!.user, 
          roles: ['viewer'], 
          role: 'viewer', 
          full_name: 'User' 
        });
        setSession(session);
        setLoading(false);
      }
    }
  }, []);

  const handleAuthStateChange = useCallback((event: string, session: Session | null) => {
    if (!isMounted.current) return;

    if (event === 'SIGNED_OUT') {
      setUser(null);
      setSession(null);
      router.push('/login');
    } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      getProfileAndSetUser(session);
    }
  }, [getProfileAndSetUser, router]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('INITIAL_SESSION', session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    return () => {
      isMounted.current = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signIn = async (email: string, password: string, rememberMe = true) => {
    setLoading(true);
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error || new Error('Login failed');

      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, persistent: rememberMe })
      });

      return { error: null };
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Login error');
      setError(e);
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      
      // First, check if user exists in auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (user) {
        // User is already signed in
        await signOut();
        throw new Error('Please sign out before creating a new account');
      }

      // Check if this is the first user
      const { count: userCount, error: countError } = await supabase
        .from('user_roles_denorm')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error checking user count:', countError);
        throw new Error('Failed to check existing users');
      }

      const isFirstUser = userCount === 0;
      // Only assign admin to the first user, others get viewer by default
      const rolesToAssign = isFirstUser ? ['admin', 'viewer'] : ['viewer'];
      console.log(`Assigning roles to new user: ${rolesToAssign.join(', ')}`);

      // 1. Create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName || email.split('@')[0],
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw signUpError;
      }

      if (!authData.user) throw new Error('User creation failed');

      // 2. Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: email,
          full_name: fullName || email.split('@')[0],
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }
      
      // 3. Assign role(s)
      // Insert roles directly into user_roles_denorm
      const { error: roleError } = await supabase
        .from('user_roles_denorm')
        .insert([{
          user_id: authData.user.id,
          is_admin: isFirstUser,  // Only true for first user
          is_viewer: true,        // Always true for all users
          is_clerk: false,
          is_donor: false,
          is_member: false
        }]);

      if (roleError) {
        console.error('Role assignment error:', roleError);
        throw roleError;
      }

      console.log(`User ${email} created successfully with roles: ${rolesToAssign.join(', ')}`);
      return { 
        error: null,
        user: authData.user,
        isFirstUser
      };
    } catch (err) {
      console.error('Signup error:', err);
      return { 
        error: err instanceof Error ? err : new Error('Sign-up error'),
        user: null,
        isFirstUser: false
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // First sign out from Supabase
      await getSupabaseClient().auth.signOut();
      
      // Then try to clear the session
      try {
        const response = await fetch('/api/session', { 
          method: 'DELETE', 
          credentials: 'include' 
        });
        
        if (!response.ok) {
          console.warn('Session deletion failed, but continuing with sign out');
        }
      } catch (err) {
        console.warn('Error during session cleanup:', err);
      }
      
      // Clear local state and redirect
      setUser(null);
      setSession(null);
      setCurrentRole(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // switchRole is now defined in the main hook body with useCallback

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Reset error') };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentRole');
    }
    await signOut();
  }, [signOut]);

  // Role helper methods
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user?.rolesRecord) return false;
    return user.rolesRecord[`is_${role}` as keyof UserRolesRecord] === true;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!user?.rolesRecord) return false;
    return roles.some(role => hasRole(role));
  }, [user, hasRole]);

  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    if (!user?.rolesRecord) return false;
    return roles.every(role => hasRole(role));
  }, [user, hasRole]);

  // Update user with roles from rolesRecord if available
  const updateUserWithRoles = useCallback((userData: any, rolesRecord?: UserRolesRecord) => {
    if (!userData) return null;
    
    // If we have a rolesRecord, extract the roles from it
    let roles: UserRole[] = [];
    if (rolesRecord) {
      if (rolesRecord.is_admin) roles.push('admin');
      if (rolesRecord.is_viewer) roles.push('viewer');
      if (rolesRecord.is_clerk) roles.push('clerk');
      if (rolesRecord.is_donor) roles.push('donor');
      if (rolesRecord.is_member) roles.push('member');
    } else if (userData.roles) {
      // Fall back to existing roles if no record provided
      roles = [...userData.roles];
    }
    
    // Ensure we always have at least the viewer role
    if (roles.length === 0) {
      roles = ['viewer'];
    }
    
    // Preserve the current role if it's still valid, otherwise use the first role
    const currentRole = userData.role && roles.includes(userData.role) 
      ? userData.role 
      : roles[0];
    
    return {
      ...userData,
      roles,
      role: currentRole, // For backward compatibility
      rolesRecord: rolesRecord || userData.rolesRecord
    };
  }, []);

  // Fetch user roles from the denormalized table
  const fetchUserAndRoles = useCallback(async (userId: string) => {
    try {
      const { data: rolesRecord, error: rolesError } = await supabase
        .from('user_roles_denorm')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (rolesError) {
        // If no record exists, create a default one
        if (rolesError.code === 'PGRST116') { // No rows found
          console.log('No roles record found, creating default viewer role');
          const { data: newRecord, error: createError } = await supabase
            .from('user_roles_denorm')
            .insert([{ 
              user_id: userId,
              is_viewer: true,
              is_admin: false,
              is_clerk: false,
              is_donor: false,
              is_member: false
            }])
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating default roles record:', createError);
            return null;
          }
          return newRecord;
        }
        
        console.error('Error fetching user roles:', rolesError);
        return null;
      }

      return rolesRecord;
    } catch (error) {
      console.error('Error in fetchUserAndRoles:', error);
      return null;
    }
  }, [supabase]);

  // Update signIn to use the new roles structure
  const signInWithRoles = useCallback(async (email: string, password: string, rememberMe = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error);
        return { error };
      }

      if (data.session?.user) {
        const rolesRecord = await fetchUserAndRoles(data.session.user.id);
        const userWithRoles = updateUserWithRoles(data.session.user, rolesRecord);
        
        if (userWithRoles) {
          setUser(userWithRoles);
          setSession(data.session);
          
          // Set current role (try to get from localStorage first, then use the first role)
          const savedRole = typeof window !== 'undefined' ? localStorage.getItem('currentRole') : null;
          const defaultRole = userWithRoles.roles[0] || null;
          setCurrentRole(savedRole && userWithRoles.roles.includes(savedRole as UserRole) 
            ? savedRole as UserRole 
            : defaultRole);
        }
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      setError(err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchUserAndRoles, updateUserWithRoles]);

  // Update signUp to use the new roles structure
  const signUpWithRoles = useCallback(async (email: string, password: string, fullName?: string, initialRoles: UserRole[] = ['viewer']) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if this is the first user (will be admin)
      const { count } = await supabase
        .from('user_roles_denorm')
        .select('*', { count: 'exact', head: true });
      
      const isFirstUser = count === 0;
      
      // If first user, add admin role
      if (isFirstUser) {
        initialRoles = [...initialRoles, 'admin'];
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        setError(error);
        return { error, user: null, isFirstUser };
      }

      if (data.user) {
        // Create roles record
        const rolesRecord = {
          user_id: data.user.id,
          is_admin: initialRoles.includes('admin'),
          is_viewer: initialRoles.includes('viewer'),
          is_clerk: initialRoles.includes('clerk'),
          is_donor: initialRoles.includes('donor'),
          is_member: initialRoles.includes('member'),
        };

        const { error: rolesError } = await supabase
          .from('user_roles_denorm')
          .upsert(rolesRecord);

        if (rolesError) {
          console.error('Error creating roles record:', rolesError);
          setError(rolesError);
          return { error: rolesError, user: null, isFirstUser };
        }

        // Update user with roles
        const userWithRoles = updateUserWithRoles(data.user, rolesRecord);
        if (userWithRoles) {
          setUser(userWithRoles);
          setCurrentRole(userWithRoles.roles[0] || null);
        }
      }

      return { error: null, user: data.user, isFirstUser };
    } catch (error) {
      const err = error as Error;
      setError(err);
      return { error: err, user: null, isFirstUser: false };
    } finally {
      setLoading(false);
    }
  }, [updateUserWithRoles]);

  // Update switchRole to work with the new structure
  const switchRole = useCallback(async (role: UserRole): Promise<boolean> => {
    console.log('Switching to role:', role);
    
    if (!user) {
      console.error('No user logged in');
      return false;
    }
    
    // Verify the user has the requested role
    const userHasRole = user.roles.includes(role);
    if (!userHasRole) {
      console.error(`User does not have the role: ${role}`);
      return false;
    }
    
    try {
      console.log('Setting current role in state and localStorage to:', role);
      
      // Update the current role in state
      setCurrentRole(role);
      
      // Persist the role in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentRole', role);
      }
      
      // Force a refresh of the user data to ensure UI updates
      try {
        const { data: rolesRecord, error } = await supabase
          .from('user_roles_denorm')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error refreshing user roles:', error);
          return false;
        } else if (rolesRecord) {
          // Update the user with the latest roles
          const updatedUser = updateUserWithRoles(user, rolesRecord);
          if (updatedUser) {
            console.log('Updated user with roles:', updatedUser.roles);
            setUser(updatedUser);
            return true;
          }
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error switching role:', error);
      return false;
    }
  }, [user, updateUserWithRoles, supabase]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      currentRole,
      setCurrentRole, // Add setCurrentRole to the context value
      signIn: signInWithRoles,
      signUp: signUpWithRoles,
      signOut: handleSignOut,
      resetPassword,
      switchRole,
      hasRole,
      hasAnyRole,
      hasAllRoles,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
