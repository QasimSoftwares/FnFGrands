'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import { PostgrestError } from '@supabase/supabase-js';

type GrantStatus = 'draft' | 'applied' | 'awarded' | 'rejected' | 'pending';

type GrantBase = {
  id: string;
  name: string;
  donor: string;
  type: string;
  category: string;
  amount: number;
  status: GrantStatus;
  applied_date: string | null;
  deadline: string | null;
  last_follow_up: string | null;
  next_follow_up: string | null;
  amount_awarded: number | null;
  outcome_summary: string | null;
  responsible_person: string | null;
  progress_notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
  organization_id: string | null;
};

type Grant = GrantBase;

type GrantInsert = Omit<GrantBase, 
  'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'user_id'
> & {
  id?: string;
  user_id?: string;
};

type GrantUpdate = Partial<Omit<GrantBase, 'id'>> & { id: string };

type GrantContextType = {
  grants: Grant[];
  loading: boolean;
  error: string | null;
  currentGrant: Grant | null;
  selectedGrant: Grant | null;
  fetchGrants: () => Promise<void>;
  addGrant: (grant: GrantInsert) => Promise<Grant | null>;
  updateGrant: (id: string, updates: GrantUpdate) => Promise<Grant | null>;
  deleteGrant: (id: string) => Promise<boolean>;
  restoreGrant: (id: string) => Promise<boolean>;
  setCurrentGrant: (grant: Grant | null) => void;
  setSelectedGrant: (grant: Grant | null) => void;
  getGrantById: (id: string) => Grant | undefined;
  hasPermission: (permission: string) => boolean;
};

const GrantContext = createContext<GrantContextType | undefined>(undefined);

type User = {
  id: string;
  email?: string;
};

type SupabaseClient = any;

type GrantContextProviderProps = {
  children: React.ReactNode;
  user?: User;
  supabase?: SupabaseClient;
  authLoading?: boolean;
};

const safeParseDate = (value: unknown): string | null => {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const safeParseNumber = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const GrantProvider = ({
  children,
  user: propUser,
  supabase: propSupabase,
  authLoading: propAuthLoading,
}: GrantContextProviderProps) => {
  const auth = useAuth();
  const user = propUser || auth.user;
  const supabase = propSupabase || auth.supabase;
  const authLoading = propAuthLoading ?? auth.loading ?? false;

  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGrant, setCurrentGrant] = useState<Grant | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);

  const fetchGrants = useCallback(async () => {
    if (!user?.id || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let isViewer = false;
      let userOrgId: string | null = null;
      
      // First try to get user profile and roles
      try {
        // Get user profile first to check organization
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!profileError) {
          userOrgId = profileData?.organization_id || null;
        }

        // Then try to get user roles
        const { data: rolesData, error: rolesError } = await supabase
          .rpc('get_user_roles', { p_user_id: user.id });

        if (!rolesError && Array.isArray(rolesData)) {
          isViewer = rolesData.some((role: any) => role.role_name === 'viewer');
        }
      } catch (error) {
        console.warn('Could not fetch user profile or roles, falling back to default behavior:', error);
        // If there's an error, we'll proceed with default values
      }

      // Start building the query
      let query = supabase
        .from('grants')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      // Apply organization filter if user is not a viewer and has an organization
      if (!isViewer && userOrgId) {
        query = query.eq('organization_id', userOrgId);
      }

      // Execute the query
      const { data: grantsData, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching grants:', fetchError);
        throw fetchError;
      }

      const processed = (grantsData || []).map((grant: any): Grant => ({
        id: grant.id || '',
        name: grant.name || '',
        donor: grant.donor || '',
        type: grant.type || '',
        category: grant.category || '',
        amount: safeParseNumber(grant.amount),
        status: (grant.status || 'draft') as GrantStatus,
        applied_date: safeParseDate(grant.applied_date),
        deadline: safeParseDate(grant.deadline),
        last_follow_up: safeParseDate(grant.last_follow_up),
        next_follow_up: safeParseDate(grant.next_follow_up),
        amount_awarded: grant.amount_awarded ? safeParseNumber(grant.amount_awarded) : null,
        outcome_summary: grant.outcome_summary || null,
        responsible_person: grant.responsible_person || null,
        progress_notes: grant.progress_notes || null,
        user_id: grant.user_id || user?.id || '',
        created_at: grant.created_at || new Date().toISOString(),
        updated_at: grant.updated_at || new Date().toISOString(),
        created_by: grant.created_by || user?.id || '',
        updated_by: grant.updated_by || user?.id || '',
        deleted_at: safeParseDate(grant.deleted_at),
        organization_id: grant.organization_id || null,
      }));

      setGrants(processed);
    } catch (err) {
      const error = err as Error | PostgrestError;
      console.error('Error fetching grants:', error);
      setError(error.message || 'Failed to fetch grants');
    } finally {
      setLoading(false);
    }
  }, [user, supabase, setLoading, setError, setGrants]);

  const addGrant = useCallback(async (grantData: GrantInsert) => {
    if (!user?.id || !supabase) {
      throw new Error('User not authenticated or database not available');
    }

    // Get user's organization if not provided
    if (!grantData.organization_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.organization_id) {
        grantData.organization_id = profile.organization_id;
      } else {
        throw new Error('User is not associated with an organization');
      }
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      const newGrant = {
        ...grantData,
        created_by: user.id,
        updated_by: user.id,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('grants')
        .insert(newGrant)
        .select()
        .single();

      if (error || !data) throw error ?? new Error('Failed to create grant');

      await fetchGrants();
      toast.success('Grant created successfully');
      return data as Grant;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add grant.';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, user, fetchGrants]);

  const updateGrant = useCallback(async (id: string, updates: Partial<GrantUpdate>) => {
    if (!user?.id || !supabase) {
      throw new Error('User not authenticated or database not available');
    }

    // Ensure organization_id is not being changed
    if ('organization_id' in updates) {
      delete updates.organization_id;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('grants')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error ?? new Error('Failed to update grant');

      await fetchGrants();
      toast.success('Grant updated');
      return data as Grant;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update grant.';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, user, fetchGrants]);

  const deleteGrant = useCallback(async (id: string) => {
    if (!user?.id || !supabase) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('grants')
        .update({
          deleted_at: new Date().toISOString(),
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await fetchGrants();
      toast.success('Grant deleted');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete grant.';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, user, fetchGrants]);

  const restoreGrant = useCallback(async (id: string) => {
    if (!user?.id || !supabase) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('grants')
        .update({
          deleted_at: null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await fetchGrants();
      toast.success('Grant restored');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to restore grant.';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, user, fetchGrants]);

  const getGrantById = useCallback((id: string): Grant | undefined => {
    if (!grants) return undefined;
    return grants.find(grant => grant.id === id);
  }, [grants]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    const role = (user as any)?.role ?? 'user';
    return permission === 'admin' ? role === 'admin' : true;
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchGrants();
    if (!authLoading && !user) {
      setGrants([]);
      setLoading(false);
    }
  }, [authLoading, user, fetchGrants]);

  const contextValue = useMemo(() => ({
    grants,
    loading,
    error,
    currentGrant,
    selectedGrant,
    fetchGrants,
    addGrant,
    updateGrant,
    deleteGrant,
    restoreGrant,
    getGrantById,
    setCurrentGrant,
    setSelectedGrant,
    hasPermission,
  }), [
    grants,
    loading,
    error,
    currentGrant,
    selectedGrant,
    fetchGrants,
    addGrant,
    updateGrant,
    deleteGrant,
    restoreGrant,
    getGrantById,
  ]);

  return (
    <GrantContext.Provider value={contextValue}>
      {children}
    </GrantContext.Provider>
  );
};

export const useGrants = (): GrantContextType => {
  const context = useContext(GrantContext);
  if (!context) {
    throw new Error('useGrants must be used within a GrantProvider');
  }
  return context;
};
