'use client';

import { RoleGuard } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Example of a component that requires admin role
const AdminOnlyContent = () => (
  <Card>
    <CardHeader>
      <CardTitle>Admin Dashboard</CardTitle>
      <CardDescription>This content is only visible to admins</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Welcome to the admin dashboard. You have access to all administrative features.</p>
    </CardContent>
  </Card>
);

// Example of a component that requires donor role
const DonorContent = () => (
  <Card>
    <CardHeader>
      <CardTitle>Donor Portal</CardTitle>
      <CardDescription>Welcome, donor!</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Thank you for your contributions. Here are your recent donations and impact.</p>
    </CardContent>
  </Card>
);

// Example of a component that requires member role
const MemberContent = () => (
  <Card>
    <CardHeader>
      <CardTitle>Member Dashboard</CardTitle>
      <CardDescription>Welcome to the members area</CardDescription>
    </CardHeader>
    <CardContent>
      <p>This is the member dashboard. Here you can access member-only features.</p>
    </CardContent>
  </Card>
);

// Example of a component that requires viewer role
const ViewerContent = () => (
  <Card>
    <CardHeader>
      <CardTitle>Viewer Dashboard</CardTitle>
      <CardDescription>Read-only access</CardDescription>
    </CardHeader>
    <CardContent>
      <p>You have view-only access to this content.</p>
    </CardContent>
  </Card>
);

export default function RoleTestComponent() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Role-Based Component Testing</h2>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Using RoleGuard Component</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleGuard requiredRoles="admin">
            <AdminOnlyContent />
          </RoleGuard>
          
          <RoleGuard requiredRoles={['admin', 'donor']}>
            <DonorContent />
          </RoleGuard>
          
          <RoleGuard requiredRoles="member">
            <MemberContent />
          </RoleGuard>
          
          <RoleGuard requiredRoles={['viewer', 'admin', 'donor', 'member']}>
            <ViewerContent />
          </RoleGuard>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Using hasRole in Components</h3>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mixed Access Example</CardTitle>
              <CardDescription>Showing different content based on roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoleGuard requiredRoles="admin">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-green-800">Admin Notice</h4>
                  <p className="text-sm text-green-700">This is only visible to administrators.</p>
                </div>
              </RoleGuard>
              
              <RoleGuard requiredRoles={['admin', 'donor']}>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800">Donor Section</h4>
                  <p className="text-sm text-blue-700">This is visible to donors and admins.</p>
                  
                  <RoleGuard requiredRoles="admin">
                    <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                      <p>Admin-only content inside donor section</p>
                    </div>
                  </RoleGuard>
                </div>
              </RoleGuard>
              
              <RoleGuard requiredRoles={['member', 'admin']}>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                  <h4 className="font-medium text-purple-800">Member Area</h4>
                  <p className="text-sm text-purple-700">Welcome to the member section.</p>
                </div>
              </RoleGuard>
              
              <RoleGuard requiredRoles={['viewer', 'admin', 'donor', 'member']}>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                  <h4 className="font-medium text-gray-800">Public Notice</h4>
                  <p className="text-sm text-gray-700">This is visible to everyone with any role.</p>
                </div>
              </RoleGuard>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h3 className="font-medium text-yellow-800">Testing Instructions</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-yellow-700">
          <li>Log in with different user accounts to test role-based access</li>
          <li>Try accessing different sections with different roles</li>
          <li>Check the console for any errors or warnings</li>
          <li>Test nested RoleGuard components</li>
        </ol>
      </div>
    </div>
  );
}
