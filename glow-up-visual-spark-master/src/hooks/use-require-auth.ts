import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from '@/types'

type UseRequireAuthOptions = {
  requiredRole?: UserRole
  redirectTo?: string
}

export function useRequireAuth({
  requiredRole,
  redirectTo = '/login',
}: UseRequireAuthOptions = {}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // If no user is logged in, redirect to login
    if (!user) {
      router.push(redirectTo)
      return
    }

    // If a role is required but user doesn't have it, redirect to unauthorized
    if (requiredRole && user.role !== requiredRole) {
      router.push('/unauthorized')
    }
  }, [user, isLoading, requiredRole, router, redirectTo])

  return { user, isLoading }
}
