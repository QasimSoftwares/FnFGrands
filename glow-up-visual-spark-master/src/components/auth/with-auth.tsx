import { useRouter } from 'next/navigation'
import { useEffect, ComponentType } from 'react'
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from '@/types'

type WithAuthProps = {
  requiredRole?: UserRole
  redirectTo?: string
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthProps = { redirectTo: '/login' }
) {
  const { requiredRole, redirectTo = '/login' } = options

  return function WithAuthWrapper(props: P) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading) {
        // Redirect if user is not logged in
        if (!user) {
          router.push(redirectTo)
          return
        }

        // Check if user has required role
        if (requiredRole && user.role !== requiredRole) {
          router.push('/unauthorized')
        }
      }
    }, [user, isLoading, router, requiredRole])

    // Show loading state while checking auth
    if (isLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )
    }

    // Check if user has required role
    if (requiredRole && user.role !== requiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}
