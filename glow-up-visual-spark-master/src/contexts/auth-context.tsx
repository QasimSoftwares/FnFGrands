'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Import UserRole from types
import { UserRole } from '@/types';

// Extend the User type
export interface AppUser extends User {
  roles: UserRole[];
  full_name?: string;
  role?: UserRole; // Backward compatibility
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
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  switchRole: (role: UserRole) => void;
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

      // Try to get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      // Fetch user roles with better error handling
      let roles: UserRole[] = ['viewer']; // Default role
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
          
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
        } else if (rolesData && rolesData.length > 0) {
          roles = rolesData.map(r => r.role as UserRole);
        } else {
          console.log('No roles found for user, assigning default "viewer" role');
          // Assign default viewer role if no roles exist
          const { error: assignError } = await supabase
            .from('user_roles')
            .insert([{ user_id: session.user.id, role: 'viewer' }]);
          
          if (assignError) console.error('Error assigning default role:', assignError);
        }
      } catch (err) {
        console.error('Exception when fetching roles:', err);
      }

      const full_name = profile?.full_name || 
                       session.user.user_metadata?.full_name || 
                       session.user.email?.split('@')[0] || 
                       'User';

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
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      const isFirstUser = userCount === 0;

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
      const rolesToAssign = isFirstUser ? ['admin', 'viewer'] : ['viewer'];
      
      console.log(`Assigning roles to user ${authData.user.id}:`, rolesToAssign);
      
      const { error: roleError } = await supabase.rpc('assign_roles_to_user', {
        p_user_id: authData.user.id,
        p_roles: rolesToAssign
      });

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

  const switchRole = useCallback((role: UserRole) => {
    if (!user?.roles.includes(role)) {
      console.warn(`User does not have the role: ${role}`);
      return;
    }
    
    console.log(`Switching to role: ${role}`);
    setCurrentRole(role);
    
    // Save to localStorage to persist across page refreshes
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentRole', role);
    }
    
    // Update the user object with the new role
    setUser(prev => prev ? { ...prev, role } : null);
  }, [user?.roles]);

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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      currentRole,
      signIn,
      signUp,
      signOut: handleSignOut,
      resetPassword,
      switchRole,
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
