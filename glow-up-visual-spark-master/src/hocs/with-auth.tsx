'use client'

import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/lib/auth-provider'

export function withAuth(Component: React.ComponentType) {
  return function WithAuth(props: any) {
    const { session } = useContext(AuthContext)!
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      // Check if we're on the client side
      if (typeof window !== 'undefined') {
        if (!session) {
          router.push('/login')
        } else {
          setIsLoading(false)
        }
      }
    }, [session, router])

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
