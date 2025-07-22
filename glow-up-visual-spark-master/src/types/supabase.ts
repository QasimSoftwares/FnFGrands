export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_roles_denorm: {
        Row: {
          user_id: string
          is_admin: boolean
          is_viewer: boolean
          is_clerk: boolean
          is_donor: boolean
          is_member: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          is_admin?: boolean
          is_viewer?: boolean
          is_clerk?: boolean
          is_donor?: boolean
          is_member?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          is_admin?: boolean
          is_viewer?: boolean
          is_clerk?: boolean
          is_donor?: boolean
          is_member?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]