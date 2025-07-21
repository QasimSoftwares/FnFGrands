'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { RoleSwitcher } from '@/components/role-switcher';

export default function ClerkDashboardPage() {
  const { user, currentRole, signOut, switchRole } = useAuth();
  const router = useRouter();

  // Handle role changes and authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (currentRole !== 'clerk') {
      // If somehow we're on the clerk dashboard without clerk role, redirect to main dashboard
      router.push('/dashboard');
    }
  }, [user, currentRole, router]);

  // Handle role switching
  const handleRoleChange = async (role: string) => {
    await switchRole(role as any);
    // Force a refresh to ensure the UI updates
    router.refresh();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Clerk Dashboard</h1>
          <div className="flex items-center space-x-4">
            <RoleSwitcher 
              roles={user?.roles || []} 
              currentRole={currentRole || 'clerk'}
              onRoleChange={handleRoleChange}
            />
            <Button 
              variant="outline"
              onClick={signOut}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}!</h2>
          <p className="text-gray-600 mb-6">You are currently viewing the Clerk Dashboard.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Clerk-specific features */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Grant Management</h3>
              <p className="text-sm text-gray-600">Review and manage grant applications</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Applicant Communication</h3>
              <p className="text-sm text-gray-600">Communicate with grant applicants</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Document Review</h3>
              <p className="text-sm text-gray-600">Review and process documents</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
