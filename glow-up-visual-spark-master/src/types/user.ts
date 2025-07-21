import { User as SupabaseUser, UserMetadata } from '@supabase/supabase-js';

export type UserRole = 'viewer' | 'editor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For any additional fields
}

// Extend the base Supabase User with our custom fields
export interface User extends Omit<SupabaseUser, 'user_metadata'> {
  user_metadata: {
    full_name?: string;
    avatar_url?: string | null;
    [key: string]: any;
  };
  role: UserRole;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User | null;
  session: any;
  requiresEmailConfirmation?: boolean;
  error?: Error | null;
}

export interface AuthErrorResponse {
  error: Error;
  user: null;
  session: null;
}

export interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse | AuthErrorResponse>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResponse | AuthErrorResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<User>;
}
