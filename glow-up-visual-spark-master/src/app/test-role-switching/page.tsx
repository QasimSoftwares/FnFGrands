'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TestRoleSwitchingPage() {
  const { 
    user, 
    currentRole, 
    switchRole, 
    loading,
    hasRole,
    hasAnyRole
  } = useAuth();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Available roles to switch to
  const availableRoles = ['admin', 'viewer', 'donor', 'clerk'] as const;
  
  // Handle role switching
  const handleRoleChange = async (newRole: string) => {
    setIsSwitching(true);
    setStatus(`Switching to ${newRole} role...`);
    
    try {
      const success = await switchRole(newRole as any);
      if (success) {
        setStatus(`Successfully switched to ${newRole} role!`);
        
        // Special handling for clerk role (redirects to clerk dashboard)
        if (newRole === 'clerk') {
          setTimeout(() => {
            router.push('/clerk-dashboard');
          }, 1000);
          return;
        }
        
        // Special handling for donor role (redirects to donor dashboard)
        if (newRole === 'donor') {
          setTimeout(() => {
            router.push('/(members)/donor/dashboard');
          }, 1000);
          return;
        }
        
        // For admin/viewer, just reload the current page
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setStatus(`Failed to switch to ${newRole} role. You may not have this role.`);
      }
    } catch (error) {
      console.error('Role switch error:', error);
      setStatus(`Error switching roles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSwitching(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Role Switching Test Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
          <CardDescription>
            Test switching between different roles to verify the functionality works correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Email:</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="font-medium">Current Role:</p>
              <p className="text-muted-foreground">{currentRole || 'None'}</p>
            </div>
            <div>
              <p className="font-medium">Available Roles:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableRoles.map((role) => (
                  <span 
                    key={role} 
                    className={`px-3 py-1 rounded-full text-sm ${
                      hasRole(role as any) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Switch Role</CardTitle>
          <CardDescription>
            Select a role to switch to. You'll only be able to switch to roles you have access to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant={currentRole === role ? 'default' : 'outline'}
                disabled={isSwitching || !hasRole(role as any)}
                onClick={() => handleRoleChange(role)}
                className="capitalize"
              >
                {isSwitching && currentRole === role ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {role} {currentRole === role && '(Current)'}
              </Button>
            ))}
          </div>
          
          {status && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
              {status}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>
            This section shows what each role can access.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold">Admin</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Full access to all features</li>
              <li>Can manage users and roles</li>
              <li>Can view and edit all grants</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Viewer</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Read-only access to grants</li>
              <li>Can view reports</li>
              <li>Cannot make changes</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Donor</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>View donation history</li>
              <li>Access to donor dashboard</li>
              <li>View impact reports</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Clerk</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Process grant applications</li>
              <li>Update grant status</li>
              <li>Generate reports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
