'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useEffect } from 'react'
import { GrantEntryForm } from '@/components/grants/grant-entry-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewGrantPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])
  
  const handleSuccess = () => {
    // Redirect to the grants list after successful creation
    router.push('/grants')
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">New Grant Application</h1>
      <GrantEntryForm onSuccess={handleSuccess} />
    </div>
  )
}
