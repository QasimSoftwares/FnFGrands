'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/auth-context"
import { useGrants } from '@/contexts/grant-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// Import table components from the table file
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, RefreshCw, Loader2, Filter, ChevronDown, ChevronUp, ArrowLeft, Eye, Trash2, MoreHorizontal, Edit } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Grant, GrantStatus } from '@/types'
import { useRequireAuth } from '@/hooks/use-require-auth'

type SortOrder = 'asc' | 'desc'

interface GrantFilters {
  status: GrantStatus | '';
  sortBy: keyof Pick<Grant, 'deadline' | 'name' | 'amount' | 'status' | 'created_at'>;
  sortOrder: SortOrder;
  grantId?: string;
  donor?: string;
  appliedFrom?: string;
  appliedTo?: string;
}

export default function GrantsPage() {
  const router = useRouter();
  const { grants, loading, deleteGrant } = useGrants();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GrantFilters>({
    status: '' as GrantStatus | '',
    sortBy: 'deadline',
    sortOrder: 'asc',
    grantId: '',
    donor: '',
    appliedFrom: '',
    appliedTo: '',
  });

  // Filter and sort grants
  const filteredGrants = grants
    .filter((grant: Grant): grant is Required<Grant> => {
      if (!grant) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesName = grant.name?.toLowerCase().includes(searchLower) ?? false;
      const matchesGrantId = filters.grantId ? grant.id?.toLowerCase().includes(filters.grantId.toLowerCase()) : true;
      const matchesDonor = filters.donor ? grant.donor?.toLowerCase().includes(filters.donor.toLowerCase()) : true;
      const matchesStatus = !filters.status || grant.status === filters.status;
      const appliedDate = grant.applied_date ? new Date(grant.applied_date) : undefined;
      const matchesAppliedFrom = filters.appliedFrom && appliedDate ? appliedDate >= new Date(filters.appliedFrom) : true;
      const matchesAppliedTo = filters.appliedTo && appliedDate ? appliedDate <= new Date(filters.appliedTo) : true;
      return (
        matchesName &&
        matchesGrantId &&
        matchesDonor &&
        matchesStatus &&
        matchesAppliedFrom &&
        matchesAppliedTo &&
        !!grant.name
      );
    })
    .sort((a: Grant, b: Grant) => {
      if (filters.sortBy === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
      
      // Add more sort options as needed
      if (filters.sortBy === 'amount') {
        return filters.sortOrder === 'asc' 
          ? (a.amount || 0) - (b.amount || 0)
          : (b.amount || 0) - (a.amount || 0)
      }
      
      if (filters.sortBy === 'created_at') {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
      
      // Default sort by name
      const valueA = String(a[filters.sortBy] || '').toLowerCase()
      const valueB = String(b[filters.sortBy] || '').toLowerCase()
      return filters.sortOrder === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA)
    })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this grant? This action cannot be undone.')) {
      try {
        await deleteGrant(id)
        // The GrantContext will update the grants list automatically
      } catch (error) {
        console.error('Error deleting grant:', error)
      }
    }
  }

  const handleStatusFilter = (status: GrantStatus | '') => {
    setFilters(prev => {
      const newStatus = status === prev.status ? '' : status
      return {
        ...prev,
        status: newStatus as GrantStatus | ''
      }
    })
  }

  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' as const
    }))
  }

  if (loading && grants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading grants...</span>
      </div>
    )
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
            <Button asChild className="mt-4 md:mt-0 bg-[#004aad] hover:bg-[#003370] text-white font-bold px-6 py-2 rounded shadow-none border-none">
              <Link href="/grants/new">
                <Plus className="mr-2 h-4 w-4" />
                New Grant Application
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-xl">Search Filters</CardTitle>
          <CardDescription>Filter grants by the following criteria</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              // Optionally trigger search logic if needed
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {/* Row 1: Grant Name | Grant ID | Donor */}
              <div className="flex-1">
                <label className="block font-semibold mb-1">Grant Name</label>
                <Input
                  placeholder="Search by grant name"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="border border-[#d1d5db] focus:ring-2 focus:ring-[#005b96] focus:border-[#005b96] w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Grant ID</label>
                <Input
                  placeholder="Search by grant ID"
                  value={filters.grantId || ''}
                  onChange={e => setFilters(prev => ({ ...prev, grantId: e.target.value }))}
                  className="border border-[#d1d5db] focus:ring-2 focus:ring-[#005b96] focus:border-[#005b96] w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Donor</label>
                <Input
                  placeholder="Filter by donor"
                  value={filters.donor || ''}
                  onChange={e => setFilters(prev => ({ ...prev, donor: e.target.value }))}
                  className="border border-[#d1d5db] focus:ring-2 focus:ring-[#005b96] focus:border-[#005b96] w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Row 2: Status | Applied Date Range | Buttons */}
              <div className="flex-1 flex flex-col justify-start">
                <label className="block font-semibold mb-1">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['Draft', 'Review', 'Approved', 'Rejected'].map(status => (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      className={
                        filters.status === status
                          ? 'bg-[#005b96] text-white font-bold border-[#005b96] hover:bg-[#004aad] hover:border-[#004aad]'
                          : 'bg-white text-black font-bold border-[#d1d5db] hover:bg-blue-50 hover:border-[#004aad]'
                      }
                      onClick={() => setFilters(prev => ({ ...prev, status: filters.status === status ? '' : status }))}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-start">
                <label className="block font-semibold mb-1">Applied Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.appliedFrom || ''}
                    onChange={e => setFilters(prev => ({ ...prev, appliedFrom: e.target.value }))}
                    className="border border-[#d1d5db] focus:ring-2 focus:ring-[#005b96] focus:border-[#005b96] w-full"
                  />
                  <Input
                    type="date"
                    value={filters.appliedTo || ''}
                    onChange={e => setFilters(prev => ({ ...prev, appliedTo: e.target.value }))}
                    className="border border-[#d1d5db] focus:ring-2 focus:ring-[#005b96] focus:border-[#005b96] w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>From</span>
                  <span>To</span>
                </div>
              </div>
              <div className="flex-1 flex items-end justify-end">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border border-black bg-white text-black rounded-md px-6 h-10 font-normal shadow-sm hover:border-[#222] focus:outline-none focus:ring-2 focus:ring-[#005b96] flex items-center gap-2"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({
                        status: '' as GrantStatus | '',
                        sortBy: 'deadline',
                        sortOrder: 'asc',
                        grantId: '',
                        donor: '',
                        appliedFrom: '',
                        appliedTo: '',
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    className="bg-[#004aad] text-white border border-[#004aad] rounded-md px-6 h-10 font-semibold shadow-sm hover:bg-[#003b80] hover:border-[#003b80] focus:outline-none focus:ring-2 focus:ring-[#005b96] flex items-center gap-2"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4 mr-1 text-white" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>


      {/* Grants Table */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-bold">Search Results</CardTitle>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-base border border-gray-300">
              {filteredGrants.length} grant{filteredGrants.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200">
            <Table>
              <TableHeader>
  <TableRow>
    <TableHead className="text-lg font-bold">Grant Info</TableHead>
    <TableHead className="text-lg font-bold">Financials</TableHead>
    <TableHead className="text-lg font-bold">Status & Timeline</TableHead>
    <TableHead className="text-lg font-bold">Management</TableHead>
    <TableHead className="text-lg font-bold text-right">Actions</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {filteredGrants.length > 0 ? (
    filteredGrants.map((grant) => (
      <TableRow key={grant.id} className="hover:bg-muted/50 border-b border-gray-200">
        <TableCell className="py-4">
          <div className="flex flex-col gap-1">
            <Link href={`/grants/${grant.id}`} className="font-semibold text-base hover:underline">
              {grant.name}
            </Link>
            <span className="text-xs text-muted-foreground">{grant.id}</span>
            <div className="flex gap-2 mt-1">
              {grant.type && (
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                  {grant.type}
                </span>
              )}
              {grant.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                  {grant.category}
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-4">
          <div className="flex flex-col gap-1">
            {typeof grant.amount === 'number' ? (
              <span className="text-sm">
                <span className="font-semibold">Requested:</span> {grant.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            ) : null}
            {typeof grant.amount_awarded === 'number' ? (
              <span className="text-sm">
                <span className="font-semibold">Awarded:</span> {grant.amount_awarded.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            ) : null}
            {grant.progress_notes && (
              <span className="text-xs text-muted-foreground whitespace-pre-line mt-1">
                <span className="font-semibold">Progress Notes:</span> {grant.progress_notes}
              </span>
            )}
            {typeof grant.amount !== 'number' && typeof grant.amount_awarded !== 'number' && !grant.progress_notes && (
              <span className="text-xs text-muted-foreground">No financials available.</span>
            )}
          </div>
        </TableCell>
        <TableCell className="py-4">
          <div className="flex flex-col gap-1">
            {/* Status badge */}
            <span 
              className={cn(
                'px-2 py-1 text-xs rounded-full w-fit',
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
            {/* Deadline */}
            <span className="text-xs">
              <span className="font-semibold">Deadline:</span> {grant.deadline ? format(new Date(grant.deadline), 'MMM d, yyyy') : 'N/A'}
            </span>
            {/* Last Follow-up */}
            {grant.last_follow_up && (
              <span className="text-xs">
                <span className="font-semibold">Last Follow-up:</span> {format(new Date(grant.last_follow_up), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs">
              <span className="font-semibold">Responsible:</span> {grant.responsible_person || 'N/A'}
            </span>
            {grant.next_follow_up && (
              <span className="text-xs">
                <span className="font-semibold">Next Follow-up:</span> {format(new Date(grant.next_follow_up), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-5 h-5" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/grants/${grant.id}`} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/grants/${grant.id}/edit`} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </Link>
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => handleDelete(grant.id!)} className="text-red-600 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={2} className="h-24 text-center">
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
  )
}
