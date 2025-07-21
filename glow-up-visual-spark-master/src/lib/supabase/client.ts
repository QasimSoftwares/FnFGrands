import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Create a single supabase client for interacting with your database
export function createClientClient(storage: Storage = localStorage, persistSession: boolean = true) {
  // Debug: Log available environment variables
  console.log('Available environment variables:', {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  });

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Ensure the URL has the correct format
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl.replace(/^https?:\/\//, '')}`
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
        storage,
      },
    })
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

let supabaseSingleton: ReturnType<typeof createClientClient> | null = null;
let supabaseStorage: Storage | undefined = undefined;
let supabasePersistSession: boolean = true;

export function getSupabaseClient(forceNew = false, storage?: Storage, persistSession?: boolean) {
  // Only assign storage if we're on the client
  if (typeof window !== 'undefined' && storage !== undefined) {
    supabaseStorage = storage;
  }
  if (persistSession !== undefined) {
    supabasePersistSession = persistSession;
  }
  if (!supabaseSingleton || forceNew) {
    supabaseSingleton = createClientClient(supabaseStorage, supabasePersistSession);
  }
  return supabaseSingleton;
}

export function setSupabaseStorage(storage: Storage, persistSession: boolean) {
  supabaseStorage = storage;
  supabasePersistSession = persistSession;
  supabaseSingleton = createClientClient(supabaseStorage, supabasePersistSession);
}
