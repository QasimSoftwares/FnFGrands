'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useGrants } from '@/contexts/grant-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Trash2, Clock, Activity, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Grant, GrantStatus, UserRole } from '@/types';
import Image from 'next/image';
import { RoleSwitcher } from '@/components/role-switcher';

export default function DashboardPage() {
  const { 
    user, 
    loading, 
    signOut, 
    currentRole, 
    setCurrentRole, 
    switchRole 
  } = useAuth();
  const { grants } = useGrants();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debug log when component renders
  useEffect(() => {
    console.log('Dashboard rendered with role:', currentRole);
    console.log('User roles:', user?.roles);
  }, [currentRole, user?.roles]);

  // Handle role switching with proper error handling and UI feedback
  const handleRoleChange = async (newRole: UserRole) => {
    console.log('Role change requested:', newRole);
    
    // Prevent unnecessary role switches
    if (currentRole === newRole) {
      console.log('Already in the requested role, no change needed');
      return;
    }
    
    // Show loading state if needed
    const originalRole = currentRole;
    try {
      console.log('Initiating role switch to:', newRole);
      
      // Update the UI optimistically
      setCurrentRole(newRole);
      
      // Attempt to switch the role
      const success = await switchRole(newRole);
      
      if (success) {
        console.log('Role changed successfully, updating UI...');
        
        // Reset any search or filter state that might be role-specific
        setSearchQuery('');
        
        // Only reload if absolutely necessary (e.g., for Clerk dashboard redirect)
        if (newRole === 'clerk') {
          window.location.href = '/clerk-dashboard';
        }
      } else {
        console.error('Role switch failed - user might not have the requested role');
        // Revert to original role in UI if switch failed
        setCurrentRole(originalRole);
      }
    } catch (error) {
      console.error('Error during role switch:', error);
      // Revert to original role in case of error
      setCurrentRole(originalRole);
      
      // Optionally show an error message to the user
      // You could use a toast notification here
    }
  };
  
  // Effect to handle role changes and redirects
  useEffect(() => {
    if (!loading && currentRole === 'clerk') {
      router.push('/clerk-dashboard');
      return;
    }
  }, [currentRole, loading, router]);
  
  // Role-specific content
  const renderRoleSpecificContent = () => {
    if (!currentRole) return null;
    
    // Define role content with all possible UserRole values
    type RoleContent = {
      [key in UserRole]?: React.ReactNode;
    };
    
    const roleContent: RoleContent = {
      admin: (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold text-blue-800">Admin Dashboard</h3>
          <p className="text-blue-700">You have full administrative access to all features.</p>
          <ul className="list-disc pl-5 mt-2 text-blue-600">
            <li>Manage all grants</li>
            <li>View all user activities</li>
            <li>Configure system settings</li>
          </ul>
        </div>
      ),
      viewer: (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
          <h3 className="text-lg font-semibold text-green-800">Viewer Dashboard</h3>
          <p className="text-green-700">You have read-only access to grants.</p>
          <ul className="list-disc pl-5 mt-2 text-green-600">
            <li>View all grants</li>
            <li>Search and filter grants</li>
            <li>Export grant data</li>
          </ul>
        </div>
      ),
      clerk: (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
          <h3 className="text-lg font-semibold text-purple-800">Clerk Dashboard</h3>
          <p className="text-purple-700">You can manage grant applications and basic operations.</p>
          <ul className="list-disc pl-5 mt-2 text-purple-600">
            <li>Process grant applications</li>
            <li>Update grant status</li>
            <li>Generate reports</li>
          </ul>
        </div>
      ),
    };

    return roleContent[currentRole] || (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800">Welcome to Your Dashboard</h3>
        <p className="text-yellow-700">Your current role is: {currentRole}</p>
      </div>
    );
  };

  // Filter grants based on search query
  const filteredGrants = searchQuery
    ? grants.filter(grant => 
        grant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grant.donor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grant.status?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : grants;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // If no role is set yet, show loading
  if (loading || !currentRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = typeof user.full_name === 'string' && user.full_name.trim() !== ''
    ? user.full_name
    : user.email;
  const role = currentRole || user.role;

  // Role-specific content
  const roleContent = renderRoleSpecificContent();

  // --- Role-based content logic ---
  let recentGrants: typeof grants = [];
  let upcomingDeadlines: typeof grants = [];
  
  // Admin-specific logic
  if (role === 'admin') {
    const now = new Date();
    // Grants added by this admin in last 24h
    recentGrants = grants.filter(
      g => g.created_by === user.id && isAfter(new Date(g.created_at), addHours(now, -24))
    );
    // Any grant deadline in next 72h
    upcomingDeadlines = grants.filter(
      g => g.deadline && isAfter(new Date(g.deadline), now) && isBefore(new Date(g.deadline), addHours(now, 72))
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 relative">
              <Image 
                src="/images/logo.png" 
                alt="Family and Fellows Foundation Logo" 
                fill 
                sizes="(max-width: 768px) 40px, 40px"
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Family and Fellows Foundation</h1>
          </div>
          <div className="flex items-center space-x-4">
            <RoleSwitcher 
              roles={user?.roles || []} 
              currentRole={currentRole || 'viewer'}
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
          {/* Search and Welcome Section */}
          <div className="mb-8">
            {/* Role-specific content */}
            {renderRoleSpecificContent()}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-800">
                    Welcome, {displayName}!
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                      role === 'viewer' ? 'bg-green-100 text-green-800' : 
                      role === 'clerk' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {role?.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600">
                  {role === 'admin'
                    ? 'You have full administrative access to all features.'
                    : role === 'viewer'
                    ? 'You have read-only access to view grants and reports.'
                    : role === 'clerk'
                    ? 'You can manage grant applications and basic operations.'
                    : 'You are logged in to the Family and Fellows Foundation Grant Tracker.'}
                </p>
              
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search grants..."
                    className="pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Action Buttons */}
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start py-6 text-left px-4 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                onClick={() => router.push('/grants')}
              >
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search a Grant</span>
                </div>
              </Button>
              
              {role === 'admin' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start py-6 text-left px-4 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                    onClick={() => router.push('/grants/new')}
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-5 w-5" />
                      <span>Add New Grant</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start py-6 text-left px-4 bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                    onClick={() => router.push('/deleted')}
                  >
                    <div className="flex items-center space-x-2">
                      <Trash2 className="h-5 w-5" />
                      <span>View Deleted Grants</span>
                    </div>
                  </Button>
                </>
              )}
            </div>

            {/* Right Column - Activity and Deadlines */}
            {role === 'admin' && (
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent Activity Box */}
                  <div className="border rounded-lg p-4 h-full">
                    <div className="flex items-center space-x-2 mb-4">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-600">Grants you added in the last 24 hours</h3>
                      {recentGrants.length === 0 ? (
                        <p className="text-sm text-gray-400">No recent activity</p>
                      ) : (
                        <ul className="space-y-3">
                          {recentGrants.map(grant => (
                            <li key={grant.id} className="text-sm">
                              <span className="font-medium text-gray-800">{grant.name}</span>
                              <span className="text-gray-500 text-xs block mt-1">
                                Added {format(new Date(grant.created_at), 'MMM d, h:mm a')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Deadlines Box */}
                  <div className="border rounded-lg p-4 h-full">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-800">Upcoming Deadlines</h2>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-600">Deadlines in the next 72 hours</h3>
                      {upcomingDeadlines.length === 0 ? (
                        <p className="text-sm text-gray-400">No upcoming deadlines</p>
                      ) : (
                        <ul className="space-y-3">
                          {upcomingDeadlines.map(grant => (
                            <li key={grant.id} className="text-sm">
                              <span className="font-medium text-gray-800">{grant.name}</span>
                              <span className="text-gray-500 text-xs block mt-1">
                                Due {format(new Date(grant.deadline!), 'MMM d, h:mm a')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


// Unified grants table section
function UnifiedGrantsTable({ role }: { role: string }) {
  const { grants, loading, deleteGrant } = useGrants();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    status: GrantStatus | '';
    sortBy: keyof Pick<Grant, 'deadline' | 'name' | 'amount' | 'status' | 'created_at'>;
    sortOrder: 'asc' | 'desc';
  }>({
    status: '',
    sortBy: 'deadline',
    sortOrder: 'asc',
  });

  const filteredGrants = grants
    .filter((grant): grant is Required<Grant> => {
      if (!grant) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (grant.name?.toLowerCase().includes(searchLower) ||
          grant.donor?.toLowerCase().includes(searchLower) ||
          (grant as any).summary?.toLowerCase().includes(searchLower)) ?? false;
      const matchesStatus = !filters.status || grant.status === filters.status;
      return matchesSearch && matchesStatus && !!grant.name;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (filters.sortBy === 'amount') {
        return filters.sortOrder === 'asc'
          ? (a.amount || 0) - (b.amount || 0)
          : (b.amount || 0) - (a.amount || 0);
      }
      if (filters.sortBy === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      const valueA = String(a[filters.sortBy] || '').toLowerCase();
      const valueB = String(b[filters.sortBy] || '').toLowerCase();
      return filters.sortOrder === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this grant? This action cannot be undone.')) {
      try {
        await deleteGrant(id);
      } catch (error) {
        console.error('Error deleting grant:', error);
      }
    }
  };

  const handleStatusFilter = (status: GrantStatus | '') => {
    setFilters(prev => {
      const newStatus = status === prev.status ? '' : status;
      return {
        ...prev,
        status: newStatus as GrantStatus | '',
      };
    });
  };

  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <section id="grants" className="mt-12">
      <Card>
        <CardHeader>
          <CardTitle>Grant Applications</CardTitle>
          <CardDescription>
            {filteredGrants.length} grant{filteredGrants.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <Input
              placeholder="Search grants..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              className="flex items-center"
            >
              Sort by: Deadline
              {filters.sortOrder === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grant Name</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrants.length > 0 ? (
                  filteredGrants.map(grant => (
                    <TableRow key={grant.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/grants/${grant.id}`} className="hover:underline">
                          {grant.name}
                        </Link>
                      </TableCell>
                      <TableCell>{grant.donor}</TableCell>
                      <TableCell>
                        {grant.amount?.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            {
                              'bg-yellow-100 text-yellow-800': grant.status === 'Draft',
                              'bg-purple-100 text-purple-800': grant.status === 'Review',
                              'bg-green-100 text-green-800': grant.status === 'Approved',
                              'bg-red-100 text-red-800': grant.status === 'Rejected',
                            }
                          )}
                        >
                          {grant.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {grant.deadline ? format(new Date(grant.deadline), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/grants/${grant.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(grant.id!)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm || filters.status ? 'No grants match your filters.' : 'No grants found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
