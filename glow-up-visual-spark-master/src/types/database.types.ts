export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SelectQueryError<T> = {
  message: T
  details?: string
  hint?: string
  code?: string
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          created_by: string
          settings?: Json | null
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          updated_at?: string
          settings?: Json | null
        }
      }
      grants: {
        Row: {
          id: string
          name: string
          donor: string
          type: string
          category: string
          amount: number
          status: string
          applied_date: string | null
          deadline: string | null
          last_follow_up: string | null
          next_follow_up: string | null
          amount_awarded: number | null
          outcome_summary: string | null
          responsible_person: string | null
          progress_notes: string | null
          user_id: string
          organization_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string
          updated_by: string
        }
        Insert: {
          id?: string
          name: string
          donor: string
          type: string
          category: string
          amount: number
          status?: string
          applied_date?: string | null
          deadline?: string | null
          last_follow_up?: string | null
          next_follow_up?: string | null
          amount_awarded?: number | null
          outcome_summary?: string | null
          responsible_person?: string | null
          progress_notes?: string | null
          user_id: string
          organization_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by: string
          updated_by: string
        }
        Update: {
          id?: string
          name?: string
          donor?: string
          type?: string
          category?: string
          amount?: number
          status?: string
          applied_date?: string | null
          deadline?: string | null
          last_follow_up?: string | null
          next_follow_up?: string | null
          amount_awarded?: number | null
          outcome_summary?: string | null
          responsible_person?: string | null
          progress_notes?: string | null
          user_id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string
          updated_by?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          full_name: string | null
          avatar_url: string | null
          organization_id: string | null
          created_at: string
          updated_at: string
        } | null
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
