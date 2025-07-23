// Import required dependencies
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { cookies } from 'next/headers';

export type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// Cookie-based storage adapter for better SSR support
const createCookieStorage = () => {
  return {
    getItem: (key: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${key}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    },
    setItem: (key: string, value: string) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=${value}; path=/; samesite=lax; secure`;
    },
    removeItem: (key: string) => {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
    clear: () => {
      if (typeof document === 'undefined') return;
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    },
    key: (index: number) => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split(';');
      return index < cookies.length ? cookies[index].split('=')[0].trim() : null;
    },
    length: typeof document === 'undefined' ? 0 : document.cookie.split(';').length,
  } as Storage;
};

// Create a single supabase client for interacting with your database
export function createClientClient(storage?: Storage, persistSession: boolean = true) {
  // Use provided storage or default to cookie-based storage
  const safeStorage = storage || createCookieStorage();
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Initializing Supabase client with environment:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      persistSession
    });
  }

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Ensure the URL has the correct format
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl.replace(/^https?:\/\//, '')}`;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = 'Missing Supabase environment variables';
    console.error(errorMessage, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? 'set' : 'missing',
      key: supabaseAnonKey ? 'set' : 'missing',
      allEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key === 'NODE_ENV')
    });
    throw new Error(errorMessage);
  }

  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
        cookieOptions: {
          name: 'sb-auth-token',
          lifetime: 60 * 60 * 24 * 7, // 7 days
          domain: '',
          path: '/',
          sameSite: 'lax'
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'fnf-grands-app/1.0.0'
        }
      }
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

let supabaseSingleton: ReturnType<typeof createClientClient> | null = null;
let supabaseStorage: Storage | undefined = undefined;
let supabasePersistSession: boolean = true;
let isInitializing = false;

export function getSupabaseClient(forceNew = false, storage?: Storage, persistSession?: boolean) {
  // Only assign storage if we're on the client
  if (typeof window !== 'undefined' && storage !== undefined) {
    supabaseStorage = storage;
  }
  
  if (persistSession !== undefined) {
    supabasePersistSession = persistSession;
  }

  // Prevent multiple initializations
  if (isInitializing) {
    throw new Error('Supabase client is already being initialized');
  }

  if (!supabaseSingleton || forceNew) {
    isInitializing = true;
    try {
      supabaseSingleton = createClientClient(supabaseStorage, supabasePersistSession);
      
      // Add error logging for auth state changes
      supabaseSingleton.auth.onAuthStateChange((event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Supabase auth state changed:', { event, session: !!session });
        }
      });
      
      return supabaseSingleton;
    } finally {
      isInitializing = false;
    }
  }

  return supabaseSingleton;
}

export function setSupabaseStorage(storage: Storage, persistSession: boolean) {
  supabaseStorage = storage;
  supabasePersistSession = persistSession;
  supabaseSingleton = createClientClient(supabaseStorage, supabasePersistSession);
}
