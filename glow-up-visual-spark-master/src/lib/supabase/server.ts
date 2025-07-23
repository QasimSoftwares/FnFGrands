import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Create a simple cookie store that works with the current Next.js API
  const cookieStoreWrapper = {
    get: (name: string) => {
      return cookieStore.get(name)?.value
    },
    set: (name: string, value: string, options: any) => {
      cookieStore.set({
        name,
        value,
        ...options,
        sameSite: options.sameSite || 'lax',
        path: options.path || '/',
        secure: options.secure ?? process.env.NODE_ENV === 'production',
        httpOnly: options.httpOnly ?? true
      })
    },
    remove: (name: string, options: any) => {
      cookieStore.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
        expires: new Date(0)
      })
    }
  }

  return createSupabaseServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStoreWrapper.get(name)
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStoreWrapper.set(name, value, options)
        } catch (error) {
          console.error('Error setting cookie:', error)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStoreWrapper.remove(name, options)
        } catch (error) {
          console.error('Error removing cookie:', error)
        }
      },
    },
  })
}
