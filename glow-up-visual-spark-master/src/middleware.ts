import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

// Define public routes that don't require authentication
const publicRoutes = [
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password',
  '/auth/callback',
  '/_next',
  '/favicon.ico',
  '/api/auth',
  '/unauthorized'
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/settings'
]

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route) || 
    request.nextUrl.pathname === '/'
  )
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  try {
    // Create Supabase client
    const supabase = await createMiddlewareClient()
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // If there's an error getting the session or no session, redirect to login
    if (sessionError || !session) {
      console.error('No valid session found, redirecting to login')
      return redirectToLogin(request)
    }

    // For authenticated users, redirect to /dashboard if they try to access the root
    if (request.nextUrl.pathname === '/') {
      console.log('Middleware: Redirecting root path to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return redirectToLogin(request)
    }

    const userRole = profile?.role || 'viewer'
    
    // Check if the route is admin-only
    const isAdminRoute = adminRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    
    // If it's an admin route and user is not an admin, redirect to unauthorized
    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // Add user role to request headers for server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-user-id', session.user.id)
    
    // Return the response with updated headers
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
    
  } catch (error) {
    console.error('Middleware error:', error)
    return redirectToLogin(request)
  }
}

// Helper function to redirect to login with a redirect back URL
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

// Configure which routes the middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth callbacks)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
