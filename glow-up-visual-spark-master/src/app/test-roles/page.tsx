'use client';

import { useAuth } from "@/contexts/auth-context";
import { useRoles } from '@/hooks/use-roles';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import RoleTestComponent from '@/components/test/RoleTestComponent';

export default function TestRolesPage() {
  const { user } = useAuth();
  const { 
    roles, 
    hasRole, 
    hasAllRoles, 
    getHighestRole, 
    hasPermission 
  } = useRoles();
  
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  const availableRoles = ['admin', 'viewer', 'donor', 'member'];
  
  // Fetch all users and their roles
  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) return;
      
      // Only admins can see all users
      if (!hasRole('admin')) {
        // Only show current user's data
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', session.user.id)
          .single();
          
        if (userData) {
          setAllUsers([userData]);
        }
        return;
      }
      
      // Admins can see all users
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      if (users) {
        setAllUsers(users);
      }
    };
    
    fetchUsers();
  }, [hasRole]);
  
  // Fetch roles for the selected user
  const fetchUserRoles = async (userId: string) => {
    const supabase = getSupabaseClient();
    setSelectedUser(userId);
    
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', userId);
      
    if (error) {
      console.error('Error fetching user roles:', error);
      return;
    }
      
    setUserRoles(roles?.map((r: { role: string }) => r.role) || []);
  };
  
  // Add a role to a user
  const addRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('user_roles')
      .insert([{ id: selectedUser, role: selectedRole }])
      .select();
      
    if (error) {
      console.error('Error adding role:', error);
      return;
    }
    
    // Refresh roles
    fetchUserRoles(selectedUser);
  };
  
  // Remove a role from a user
  const removeRole = async (roleToRemove: string) => {
    if (!selectedUser) return;
    
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', selectedUser)
      .eq('role', roleToRemove);
      
    if (error) {
      console.error('Error removing role:', error);
      return;
    }
    
    // Refresh roles
    fetchUserRoles(selectedUser);
  };
  
  if (!user) {
    return <div className="p-8">Please log in to test roles.</div>;
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Role Management Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Current Roles</h2>
        <div className="space-y-4">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <div className="flex items-center gap-2">
            <strong>Roles:</strong>
            {roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <span 
                    key={role} 
                    className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">No roles assigned</span>
            )}
          </div>
          <p><strong>Highest Role:</strong> {getHighestRole() || 'None'}</p>
          
          <div className="mt-4 space-y-2">
            <p><strong>Role Checks:</strong></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableRoles.map(role => (
                <div 
                  key={role} 
                  className={`p-2 rounded ${hasRole(role as any) ? 'bg-green-100' : 'bg-gray-100'}`}
                >
                  hasRole('{role}'): {hasRole(role as any) ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <p><strong>Permission Checks:</strong></p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {['view', 'edit', 'admin'].map(permission => (
                <div 
                  key={permission} 
                  className={`p-2 rounded ${hasPermission(permission as any) ? 'bg-green-100' : 'bg-gray-100'}`}
                >
                  hasPermission('{permission}'): {hasPermission(permission as any) ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {hasRole('admin') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Role Management (Admin Only)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Select User</h3>
              <select 
                className="w-full p-2 border rounded"
                value={selectedUser}
                onChange={(e) => fetchUserRoles(e.target.value)}
              >
                <option value="">-- Select a user --</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.full_name || 'No name'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Add Role</h3>
              <div className="flex gap-2">
                <select 
                  className="flex-1 p-2 border rounded"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">-- Select a role --</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button 
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={addRole}
                  disabled={!selectedUser || !selectedRole}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          {selectedUser && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Current Roles</h3>
              {userRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userRoles.map(role => (
                    <div key={role} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                      <span>{role}</span>
                      <button 
                        onClick={() => removeRole(role)}
                        className="text-red-500 hover:text-red-700"
                        title={`Remove ${role} role`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No roles assigned to this user</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h3 className="font-medium text-yellow-800">Testing Instructions</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-yellow-700">
          <li>Log in with different user accounts to test role-based access</li>
          <li>If you're an admin, you can manage roles for all users</li>
          <li>Try assigning/removing roles and see how the UI updates</li>
          <li>Test role-based components with the RoleGuard component</li>
        </ol>
      </div>
      
      <div className="mt-12">
        <RoleTestComponent />
      </div>
    </div>
  );
}
