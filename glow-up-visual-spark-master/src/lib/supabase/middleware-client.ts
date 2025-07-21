import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function createMiddlewareClient() {
  const cookieStore = await cookies()
  
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Ensure the URL has the correct format
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl.replace(/^https?:\/\//, '')}`
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    })
    throw new Error('Missing Supabase environment variables')
  }

  try {
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
      cookies: {
        async get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting error
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal error
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )} catch (error) {
    console.error('Error creating Supabase middleware client:', error)
    throw error
  }
}
