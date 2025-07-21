'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Using a simple div instead of Badge component for now

export default function TestDonorPage() {
  const { user, currentRole } = useAuth();
  const router = useRouter();
  const isDonor = currentRole === 'clerk';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">Clerk Dashboard</h2>
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 text-xs font-medium rounded-full border border-gray-200 bg-gray-50 capitalize">
              {currentRole}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Donor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user.user_metadata?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Role</p>
                  <p className="font-medium capitalize">{currentRole}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Donor Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">View Donation History</h3>
                <p className="text-sm text-gray-600 mb-3">View your past donations and their impact.</p>
                <Button variant="outline" size="sm">View History</Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Make a New Donation</h3>
                <p className="text-sm text-gray-600 mb-3">Support our initiatives with a new donation.</p>
                <Button size="sm">Donate Now</Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Impact Report</h3>
                <p className="text-sm text-gray-600 mb-3">See how your donations are making a difference.</p>
                <Button variant="outline" size="sm">View Report</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
