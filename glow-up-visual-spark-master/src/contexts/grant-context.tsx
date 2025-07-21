'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'
import { Grant, UserRole, GrantStatus } from '@/types'
import { getSupabaseClient } from '@/lib/supabase/client';
import { mapDbGrantToGrant, mapGrantToDbGrant } from '@/lib/supabase/types'
import { toast } from 'sonner'

type GrantContextType = {
  grants: Grant[]
  loading: boolean
  error: string | null
  addGrant: (grant: Omit<Grant, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => Promise<Grant | null>
  updateGrant: (id: string, updates: Partial<Grant>) => Promise<Grant | null>
  deleteGrant: (id: string) => Promise<boolean>
  restoreGrant: (id: string) => Promise<boolean>
  getGrantById: (id: string) => Grant | undefined
  hasPermission: (requiredRole: UserRole) => boolean
}

const GrantContext = createContext<GrantContextType | undefined>(undefined)

export function GrantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const hasPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!user?.role) return false
    
    // Define role hierarchy with all possible roles
    const roleHierarchy = {
      'admin': 4,
      'reviewer': 3,
      'editor': 2,
      'viewer': 1
    } as const
    
    type RoleKey = keyof typeof roleHierarchy
    
    const userRole = user.role as RoleKey
    const requiredRoleKey = requiredRole as RoleKey
    
    const userRoleLevel = userRole in roleHierarchy ? roleHierarchy[userRole] : 0
    const requiredRoleLevel = requiredRoleKey in roleHierarchy ? roleHierarchy[requiredRoleKey] : 0
    
    return userRoleLevel >= requiredRoleLevel
  }, [user?.role])

  // Fetch grants on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchGrants()
    } else {
      setGrants([])
      setLoading(false)
    }
  }, [user])

  const fetchGrants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching grants from Supabase...')
      const { data, error, status, statusText } = await getSupabaseClient()
        .from('grants')
        .select('*')
        .is('deleted_at', null)
      
      console.log('Supabase response:', { data, error, status, statusText })
      
      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      
      if (!data) {
        console.warn('No data returned from Supabase')
        setGrants([])
        return
      }
      
      console.log(`Fetched ${data.length} grants from Supabase`)
      const mappedGrants = data.map(mapDbGrantToGrant)
      setGrants(mappedGrants)
    } catch (err) {
      console.error('Error in fetchGrants:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      setError('Failed to load grants: ' + (err instanceof Error ? err.message : 'Unknown error'))
      toast.error('Failed to load grants')
    } finally {
      setLoading(false)
    }
  }, [])

  const addGrant = useCallback(async (grant: Omit<Grant, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
    if (!user) {
      const errorMsg = 'You must be logged in to add a grant';
      console.error(errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    console.log('=== Starting addGrant ===');
    console.log('User ID:', user.id);
    console.log('Grant data received:', JSON.stringify(grant, null, 2));
    
    setLoading(true);
    setError(null);
    
    try {
      // Only include fields that exist in the database schema
      // Removed 'notes' field as it doesn't exist in the database
      const safeGrant = {
        name: grant.name,
        donor: grant.donor,
        type: grant.type,
        category: grant.category,
        amount: grant.amount,
        status: grant.status,
        applied_date: grant.applied_date,
        deadline: grant.deadline,
        last_follow_up: grant.last_follow_up || null,
        next_follow_up: grant.next_follow_up || null,
        amount_awarded: grant.amount_awarded || null,
        outcome_summary: grant.outcome_summary || '',
        responsible_person: grant.responsible_person || '',
        progress_notes: grant.progress_notes || '',
        // Removed 'notes' field as it doesn't exist in the database
        user_id: user.id,
        organization_id: 'default-org',
        created_by: user.id,
        updated_by: user.id,
      };
      
      console.log('Prepared grant data for DB:', JSON.stringify(safeGrant, null, 2));
      
      console.log('Sending request to Supabase...');
      const { data, error } = await getSupabaseClient()
        .from('grants')
        .insert(safeGrant)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // Try to get the database schema to help with debugging
        try {
          const { data: columns, error: schemaError } = await getSupabaseClient()
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'grants');
            
          if (!schemaError && columns) {
            console.log('📋 Grants table schema:', columns);
          }
        } catch (schemaErr) {
          console.error('Failed to fetch schema:', schemaErr);
        }
        
        throw error;
      }
      
      console.log('✅ Grant added successfully, response:', data);
      
      // Manually create the grant object to avoid mapping issues
      const newGrant: Grant = {
        id: data.id,
        name: data.name,
        donor: data.donor,
        type: data.type,
        category: data.category,
        amount: data.amount,
        status: data.status,
        applied_date: data.applied_date,
        deadline: data.deadline,
        last_follow_up: data.last_follow_up || null,
        next_follow_up: data.next_follow_up || null,
        amount_awarded: data.amount_awarded || null,
        outcome_summary: data.outcome_summary || '',
        responsible_person: data.responsible_person || '',
        progress_notes: data.progress_notes || '',
        // Removed 'notes' field as it doesn't exist in the database
        user_id: data.user_id,
        organization_id: data.organization_id || 'default-org',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        created_by: data.created_by || user.id,
        updated_by: data.updated_by || user.id,
      };
      
      setGrants(prev => [...prev, newGrant]);
      toast.success('Grant added successfully');
      return newGrant;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? `Failed to add grant: ${err.message}` : 'Failed to add grant';
      console.error('❌ Error in addGrant:', {
        error: err,
        message: errorMsg,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      setError(errorMsg);
      toast.error('Failed to add grant. Please check console for details.');
      return null;
    } finally {
      console.log('=== End of addGrant ===');
      setLoading(false);
    }
  }, [user])

  const updateGrant = useCallback(async (id: string, updates: Partial<Grant>) => {
    if (!user) {
      setError('You must be logged in to update a grant')
      return null
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await getSupabaseClient()
        .from('grants')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedGrant = mapDbGrantToGrant(data)
      setGrants(prev => prev.map(g => g.id === id ? updatedGrant : g))
      toast.success('Grant updated successfully')
      return updatedGrant
    } catch (err) {
      console.error('Error updating grant:', err)
      setError(err instanceof Error ? err.message : 'Failed to update grant')
      toast.error('Failed to update grant')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteGrant = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to delete a grant')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      
      const { error } = await getSupabaseClient()
        .from('grants')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      
      if (error) throw error
      
      setGrants(prev => prev.filter(g => g.id !== id))
      toast.success('Grant moved to trash')
      return true
    } catch (err) {
      console.error('Error deleting grant:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete grant')
      toast.error('Failed to delete grant')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  const restoreGrant = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to restore grants')
      return false
    }

    if (!hasPermission('editor')) {
      setError('You do not have permission to restore grants')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await getSupabaseClient()
        .from('grants')
        .update({ 
          deleted_at: null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setGrants(prev => {
        const exists = prev.some(g => g.id === id)
        return exists ? prev : [...prev, mapDbGrantToGrant(data)]
      })
      
      toast.success('Grant restored successfully')
      return true
    } catch (err) {
      console.error('Error restoring grant:', err)
      setError(err instanceof Error ? err.message : 'Failed to restore grant')
      toast.error('Failed to restore grant')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, hasPermission])

  const getGrantById = (id: string) => {
    return grants.find(grant => grant.id === id)
  }

  return (
    <GrantContext.Provider
      value={{
        grants,
        loading,
        error,
        addGrant,
        updateGrant,
        deleteGrant,
        restoreGrant,
        getGrantById,
        hasPermission,
      }}
    >
      {children}
    </GrantContext.Provider>
  )
}

export const useGrants = () => {
  const context = useContext(GrantContext)
  if (context === undefined) {
    throw new Error('useGrants must be used within a GrantProvider')
  }
  return context
}
