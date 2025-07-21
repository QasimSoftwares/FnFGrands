// BACKUP: DashboardPage as of 2025-07-20 04:56
// Description: This backup includes the following key updates since the last save:
// - Unified dashboard and grants overview into a single /dashboard page.
// - /grants page now only redirects to /dashboard, removing duplicate entry points.
// - Sign out button now uses signOut from useAuth context directly (fixes session clearing bug).
// - All grant management, search, and quick actions are consolidated into the dashboard.
// - Redundant/dynamic import logic for signOut removed.
// - Lint and TypeScript errors from old unreachable code resolved.
//
// This file is a direct backup of dashboard/page.tsx after these changes.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

import { useGrants } from '@/contexts/grant-context';
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
import { Plus, Search, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Grant, GrantStatus } from '@/types';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

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
  const role = user.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome, {displayName}!
          </h1>
          <p className="text-gray-600 mb-6">
            You have successfully logged in to the Family and Fellows Foundation Grant Tracker.
          </p>

          <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Your Account</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {role}</p>
            </div>
          </div>

          <UnifiedGrantsTable role={role} />

          <div className="p-4 bg-green-50 rounded border border-green-100">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Quick Actions</h2>
            <div className="flex flex-wrap gap-4 mt-3">
              {role === 'admin' && (
                <Button onClick={() => router.push('/grants/new')} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Create New Grant
                </Button>
              )}
            </div>
          </div>

          {/* Sign Out button */}
          <div className="mt-8 flex justify-end">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={async () => {
                try {
                  await signOut();
                  // Optionally force reload if you have persistent state issues
                  // window.location.href = '/login';
                } catch (e) {
                  // Optionally handle error
                }
              }}
            >
              Sign Out
            </Button>
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
          grant.donor?.toLowerCase().includes(searchLower));
      const matchesStatus = !filters.status || grant.status === filters.status;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'deadline') {
        const aDate = a.deadline ? new Date(a.deadline).getTime() : 0;
        const bDate = b.deadline ? new Date(b.deadline).getTime() : 0;
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });

  function toggleSortOrder() {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }

  function handleDelete(id: string) {
    deleteGrant(id);
  }

  return (
    <section className="mt-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find grants by name, donor, status, or deadline.</CardDescription>
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
