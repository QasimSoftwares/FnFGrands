// Backup of grants page after bugfixes and functional improvements (2025-07-20 05:20)

import { useState, useEffect } from 'react';
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
import { Plus, Search, Loader2, Filter, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Grant, GrantStatus } from '@/types';

type SortOrder = 'asc' | 'desc';

interface GrantFilters {
  status: GrantStatus | '';
  sortBy: keyof Pick<Grant, 'deadline' | 'name' | 'amount' | 'status' | 'created_at'>;
  sortOrder: SortOrder;
}

export default function GrantsPage() {
  const router = useRouter();
  const { grants, loading, deleteGrant } = useGrants();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GrantFilters>({
    status: '',
    sortBy: 'deadline',
    sortOrder: 'asc',
  });

  // Filter and sort grants
  const filteredGrants = grants
    .filter((grant: Grant): grant is Required<Grant> => {
      if (!grant) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (grant.name?.toLowerCase().includes(searchLower) ||
          grant.donor?.toLowerCase().includes(searchLower) ||
          grant.description?.toLowerCase().includes(searchLower)) ?? false;
      const matchesStatus = !filters.status || grant.status === filters.status;
      return matchesSearch && matchesStatus && !!grant.name;
    })
    .sort((a: Grant, b: Grant) => {
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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
        status: newStatus as GrantStatus | ''
      };
    });
  };

  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' as const
    }));
  };

  if (loading && grants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading grants...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-4 mb-6">
        <div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')} 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Grant Applications</h1>
            <p className="text-muted-foreground">Manage and track your grant applications</p>
          </div>
          {user?.role !== 'viewer' && (
            <Button asChild className="mt-4 md:mt-0">
              <Link href="/grants/new">
                <Plus className="mr-2 h-4 w-4" />
                New Grant Application
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search grants..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <select
                value={filters.status}
                onChange={e => handleStatusFilter(e.target.value as GrantStatus)}
                className="w-full border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Review">Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <Button variant="outline" onClick={toggleSortOrder} className="justify-start">
                <Filter className="mr-2 h-4 w-4" />
                Sort by: Deadline
                {filters.sortOrder === 'asc' ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grant Applications</CardTitle>
          <CardDescription>
            {filteredGrants.length} grant{filteredGrants.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  filteredGrants.map((grant) => (
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <Link href={`/grants/${grant.id}`}>
                            View
                          </Link>
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
    </div>
  );
}
