'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useGrants } from '@/contexts/grant-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { GrantEntryForm } from '@/components/grants/grant-entry-form'

export default function GrantDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { grants, loading, deleteGrant, getGrantById } = useGrants()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const grant = getGrantById(id as string)
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])
  
  // Handle grant deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this grant? This action cannot be undone.')) {
      try {
        setIsDeleting(true)
        await deleteGrant(id as string)
        router.push('/grants')
        // The toast notification will be shown by the GrantContext
      } catch (error) {
        console.error('Error deleting grant:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  // Show loading state
  if (loading && !grant) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading grant details...</span>
      </div>
    )
  }
  
  // Show not found state
  if (!grant) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Grant Not Found</h1>
        <p className="text-muted-foreground mb-6">The grant you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/grants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grants
          </Link>
        </Button>
      </div>
    )
  }
  
  // Show edit form if in edit mode
  if (isEditing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(false)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel Edit
        </Button>
        
        <h1 className="text-3xl font-bold mb-6">Edit Grant Application</h1>
        <GrantEntryForm 
          initialData={grant} 
          isEditing={true} 
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    )
  }
  
  // Show grant details
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/grants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Grants
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-2">{grant.name}</h1>
          <p className="text-muted-foreground">
            Created on {grant.created_at ? format(new Date(grant.created_at), 'MMMM d, yyyy') : 'N/A'}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          {user?.role === 'admin' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main grant details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Donor/Organization</p>
                  <p className="mt-1">{grant.donor || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grant Type</p>
                  <p className="mt-1">{grant.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="mt-1">{grant.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="mt-1">
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
                      {grant.status || 'N/A'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="mt-1">
                    {grant.amount?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }) || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                  <p className="mt-1">
                    {grant.deadline ? format(new Date(grant.deadline), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                {grant.last_follow_up && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Follow Up</p>
                    <p className="mt-1">
                      {format(new Date(grant.last_follow_up), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              {grant.summary && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
                  <p className="whitespace-pre-line">{grant.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Add more sections here for attachments, notes, etc. */}
        </div>
        
        {/* Sidebar with actions and metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Download Application
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Send Reminder
              </Button>
              <Button variant="outline" className="w-full justify-start">
                View History
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="mt-1">
                  {grant.created_by || 'System'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="mt-1">
                  {grant.updated_at ? format(new Date(grant.updated_at), 'MMMM d, yyyy h:mm a') : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
