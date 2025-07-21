import { Database } from '@/types/supabase'
import { Grant, GrantStatus } from '@/types'

type DbGrant = Database['public']['Tables']['grants']['Row']
type DbGrantInsert = Database['public']['Tables']['grants']['Insert']
type DbGrantUpdate = Database['public']['Tables']['grants']['Update']

export function mapDbGrantToGrant(dbGrant: DbGrant): Grant {
  return {
    id: dbGrant.id,
    name: dbGrant.name ?? '',
    donor: dbGrant.donor ?? '',
    type: dbGrant.type ?? '',
    category: dbGrant.category ?? '',
    amount: dbGrant.amount ?? 0,
    status: dbGrant.status as GrantStatus,
    created_at: dbGrant.created_at,
    updated_at: dbGrant.updated_at,
    user_id: dbGrant.user_id ?? '',
    organization_id: dbGrant.organization_id ?? '',
    created_by: dbGrant.created_by ?? '',
    // Optionals
    updated_by: dbGrant.updated_by ?? null,
    deleted_at: dbGrant.deleted_at ?? null,
    description: dbGrant.description ?? null,
    outcome_summary: dbGrant.outcome_summary ?? null,
    deadline: dbGrant.deadline ?? null,
    last_follow_up: dbGrant.last_follow_up ?? null,
    next_follow_up: dbGrant.next_follow_up ?? null,
    applied_date: dbGrant.applied_date ?? null,
    amount_awarded: dbGrant.amount_awarded ?? null,
    attachment_count: dbGrant.attachment_count ?? null,
    responsible_person: dbGrant.responsible_person ?? null,
    progress_notes: dbGrant.progress_notes ?? null,
  }
}

export function mapGrantToDbGrant(grant: Partial<Grant>): Partial<DbGrant> {
  const dbGrant: Partial<DbGrant> = { ...grant }
  
  // Ensure required fields are set
  if (grant.name) dbGrant.name = grant.name
  if (grant.status) dbGrant.status = grant.status as string
  
  // Handle optional fields
  dbGrant.description = grant.description !== undefined ? grant.description : null
  dbGrant.outcome_summary = grant.outcome_summary !== undefined ? grant.outcome_summary : null
  dbGrant.amount = grant.amount !== undefined ? grant.amount : null
  dbGrant.deadline = grant.deadline !== undefined ? grant.deadline : null
  dbGrant.donor = grant.donor !== undefined ? grant.donor : null
  dbGrant.last_follow_up = grant.last_follow_up !== undefined ? grant.last_follow_up : null
  dbGrant.type = grant.type !== undefined ? grant.type : null
  dbGrant.category = grant.category !== undefined ? grant.category : null
  
  return dbGrant
}

// Re-export types for convenience
export type { DbGrant, DbGrantInsert, DbGrantUpdate }
