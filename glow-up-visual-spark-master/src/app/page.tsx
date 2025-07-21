'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useEffect } from 'react'

export default function Dashboard() {
  const { session, user, signOut, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (session && !loading) {
      console.log('User is authenticated, redirecting to /dashboard');
      router.replace('/dashboard');
    }
  }, [session, loading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Grant Tracker</h1>
          <p className="text-gray-600">Please sign in to access your dashboard</p>
          <div className="mt-6 space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Grant Tracker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {session.user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug info - can be removed later */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Debug Info - User Role: <span className="font-bold">{user.role || 'undefined'}</span>
                  <br />
                  User ID: {user.id}
                  <br />
                  Check the browser console for more details.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              <div className="mt-4 space-y-4">
                {user?.role !== 'viewer' && (
                  <Link
                    href="/grants/new"
                    className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add New Grant
                  </Link>
                )}
                <Link
                  href="/grants"
                  className={`block w-full text-center px-4 py-2 border ${
                    user?.role === 'viewer' 
                      ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  } text-sm font-medium rounded-md`}
                >
                  Search Grants
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <div className="mt-4 text-sm text-gray-500">
                <p>No recent activity</p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
              <div className="mt-4 text-sm text-gray-500">
                <p>No upcoming deadlines</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
