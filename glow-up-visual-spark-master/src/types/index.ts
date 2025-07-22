// Database types will be defined here

export type UserRole = 'admin' | 'viewer' | 'clerk' | 'donor' | 'member';

// User roles record for denormalized structure
export interface UserRolesRecord {
  user_id: string;
  is_admin: boolean;
  is_viewer: boolean;
  is_clerk: boolean;
  is_donor: boolean;
  is_member: boolean;
  created_at?: string;
  updated_at?: string;
}

// Helper to get array of roles from UserRolesRecord
export function getRolesFromRecord(record: UserRolesRecord): UserRole[] {
  const roles: UserRole[] = [];
  if (record.is_admin) roles.push('admin');
  if (record.is_viewer) roles.push('viewer');
  if (record.is_clerk) roles.push('clerk');
  if (record.is_donor) roles.push('donor');
  if (record.is_member) roles.push('member');
  return roles;
}

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  roles: UserRole[]
  created_at: string
  updated_at: string
  full_name?: string
}

// Status type with proper casing to match UI
export type GrantStatus = 
  | 'Draft' 
  | 'Review' 
  | 'Approved' 
  | 'Rejected'

export interface Grant {
  // Required fields
  id: string
  name: string
  donor: string
  type: string
  category: string
  amount: number
  status: GrantStatus
  created_at: string
  updated_at: string
  user_id: string
  organization_id: string
  created_by: string
  
  // Optional fields
  description?: string | null
  outcome_summary?: string | null
  deadline?: string | null
  updated_by?: string | null
  deleted_at?: string | null
  last_follow_up?: string | null
  next_follow_up?: string | null
  applied_date?: string | null
  amount_awarded?: number | null
  attachment_count?: number | null
  responsible_person?: string | null
  progress_notes?: string | null
  // Removed 'notes' field as it doesn't exist in the database
}

export interface AuthContextType {
  user: UserProfile | null
  session: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T> {
  key: keyof T
  direction: SortDirection
}

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  error: any
  meta?: PaginationMeta
}

// Database type definition
export interface Database {
  // Add your database types here if needed
  [key: string]: any;
}
