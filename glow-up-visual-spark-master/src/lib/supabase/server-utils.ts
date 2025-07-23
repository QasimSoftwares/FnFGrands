import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieOptions = {
  name: string
  value: string
  domain?: string
  path?: string
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none' | boolean
  secure?: boolean
  httpOnly?: boolean
  expires?: Date
}

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Create a middleware function to handle cookies
  const cookieHandler = {
    get: (name: string) => {
      return cookieStore.get(name)?.value
    },
    set: (name: string, value: string, options: Omit<CookieOptions, 'name' | 'value'>) => {
      cookieStore.set({
        name,
        value,
        ...options,
        sameSite: options.sameSite || 'lax',
        path: options.path || '/',
        secure: options.secure ?? process.env.NODE_ENV === 'production',
        httpOnly: options.httpOnly ?? true
      })
    }
  }

  // Create the Supabase client with our cookie handler
  return createSupabaseServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (name: string) => cookieHandler.get(name),
      set: (name: string, value: string, options: any) => 
        cookieHandler.set(name, value, options),
      remove: (name: string, options: any) => 
        cookieHandler.set(name, '', { ...options, maxAge: 0 })
    }
  })
}
