import { useState, useEffect, useCallback } from 'react';
import { DonorStatus, DonorRequest } from '@/types/donor';
import { useAuth } from '@/contexts/auth-context';

type DonorStatusResponse = {
  status: DonorStatus;
  request?: DonorRequest | null;
};
export const useDonor = () => {
  const { user, session, supabase } = useAuth(); // Use supabase client from auth context

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DonorStatus>('none');
  const [donorRequest, setDonorRequest] = useState<DonorRequest | null>(null);

  const getDonorStatus = useCallback(async (): Promise<DonorStatus> => {
    if (!user || !session) {
      console.log('No user or session available');
      setStatus('none');
      return 'none';
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/donor', {
        method: 'GET',
        credentials: 'include', // Important for sending cookies
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch donor status (${response.status})`;
        throw new Error(errorMessage);
      }

      const data: DonorStatusResponse = await response.json();
      setStatus(data.status);
      setDonorRequest(data.request || null);
      return data.status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error in getDonorStatus:', errorMessage);
      setError(errorMessage);
      setStatus('none');
      return 'none';
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const requestDonorAccess = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError('Supabase client not available');
      setLoading(false);
      return false;
    }

    try {
      // First ensure we have a valid session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Failed to validate session');
        setLoading(false);
        return false;
      }
      
      if (!currentSession) {
        const errorMsg = 'You must be logged in to request donor access';
        console.error(errorMsg);
        setError(errorMsg);
        return false;
      }

      const response = await fetch('/api/donor/request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
        const errorMessage = errorData.error || `Failed to request donor access (${response.status})`;
        throw new Error(errorMessage);
      }

      const data: DonorStatusResponse = await response.json();
      setStatus(data.status);
      setDonorRequest(data.request || null);
      
      // Refresh the donor status
      await getDonorStatus();
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request donor access';
      console.error('Error in requestDonorAccess:', errorMessage, error);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, session, getDonorStatus]);

  return {
    status,
    loading,
    error,
    request: donorRequest,
    getDonorStatus,
    requestDonorAccess,
    isDonor: status === 'approved',
    isPending: status === 'pending',
    hasRequested: !!donorRequest,
  };
};
