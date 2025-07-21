'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// --- Define AppUser type with role ---
type UserRole = 'admin' | 'viewer';
export interface AppUser extends User {
  role: UserRole;
  full_name?: string;
}

type AuthContextType = {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();


  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // --- Heartbeat marker logic for strict session invalidation ---
    const SESSION_MARKER = 'grant_tracker_active_tab';
    const SUPABASE_SESSION_KEY_PREFIX = 'sb-';
    // On page load: if session exists in sessionStorage but marker is missing, force sign out
    if (typeof window !== 'undefined' && sessionStorage) {
      const hasMarker = sessionStorage.getItem(SESSION_MARKER);
      const hasSupabaseSession = Object.keys(sessionStorage).some(k => k.startsWith(SUPABASE_SESSION_KEY_PREFIX));
      if (!hasMarker && hasSupabaseSession) {
        // Remove all Supabase session keys from sessionStorage
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith(SUPABASE_SESSION_KEY_PREFIX)) sessionStorage.removeItem(k);
        });
        // Reload to reset auth state
        window.location.reload();
      }
    }
    // On mount: if using non-rememberMe, set marker
    if (typeof window !== 'undefined' && sessionStorage) {
      sessionStorage.setItem(SESSION_MARKER, '1');
      // On unload, remove marker
      window.addEventListener('unload', () => {
        sessionStorage.removeItem(SESSION_MARKER);
      });
    }

    const getProfileAndSetUser = async (session: Session | null, attempt = 1) => {
      console.log(`[Auth] getProfileAndSetUser called (attempt ${attempt})`, { session });
      if (!session?.user) {
        if (isMounted) {
          console.log('[Auth] No session user, clearing user/session');
          setUser(null);
          setSession(null);
          setLoading(false);
        }
        return;
      }
      // Fetch profile from Supabase
      const { data: profile, error } = await getSupabaseClient()
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();
      console.log(`[Auth] Profile fetch result (attempt ${attempt})`, { profile, error });

      if (error || !profile) {
        if (attempt < 3) {
          console.warn(`[Auth] Profile not found, retrying in 700ms (attempt ${attempt})`, { error });
          setTimeout(() => {
            getProfileAndSetUser(session, attempt + 1);
          }, 700);
          return;
        }
        // fallback: treat as viewer if profile missing after retries
        if (isMounted) {
          console.error('[Auth] Profile not found after retries, falling back to role=viewer', { error });
          setUser({ ...session.user, role: 'viewer' });
          setSession(session);
          setLoading(false);
        }
        return;
      }
      if (isMounted) {
        console.log('[Auth] Profile found, setting user', { role: profile.role, full_name: profile.full_name });
        setUser({ ...session.user, role: profile.role as UserRole, full_name: profile.full_name });
        setSession(session);
        setLoading(false);
      }
    };

    // Get initial session
    getSupabaseClient().auth.getSession().then(({ data: { session } }) => {
      getProfileAndSetUser(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
      getProfileAndSetUser(session);
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      // Supabase Auth login
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data?.user) {
        setError(error || new Error('No user returned'));
        console.error('Sign in error:', error?.message);
        return { error: error || new Error('No user returned') };
      }
      // Call backend session API to create a session
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user.id,
          persistent: rememberMe
        }),
      });
      if (!sessionRes.ok) {
        const { error: sessionError } = await sessionRes.json();
        setError(new Error(sessionError || 'Session creation failed'));
        return { error: new Error(sessionError || 'Session creation failed') };
      }
      return { error: null };
    } catch (error) {
      setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      console.error('Error during sign in:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    } finally {
      setLoading(false);
    }
  };


  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error('Sign up error:', error.message);
      }
      return { error };
    } catch (error) {
      console.error('Error during sign up:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Revoke backend session
      await fetch('/api/session', { method: 'DELETE', credentials: 'include' });
      // Supabase sign out
      await getSupabaseClient().auth.signOut();
      setUser(null);
      setSession(null);
      router.push('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        console.error('Password reset error:', error.message);
      }
      return { error };
    } catch (error) {
      console.error('Error during password reset:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
