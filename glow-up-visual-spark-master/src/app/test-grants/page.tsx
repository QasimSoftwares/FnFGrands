'use client';

import { useCallback, useEffect, useState } from 'react';
import { useGrants } from '@/contexts/grant-context';
import { useAuth } from '@/contexts/auth-context';

export default function TestGrantsPage() {
  const { user } = useAuth();
  const { grants, loading, error, fetchGrants } = useGrants();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: roles } = await supabase
          .rpc('get_user_roles', { p_user_id: user.id })
          .select('*');

        setUserInfo({
          ...profile,
          roles: roles || []
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
    fetchGrants();
  }, [user, fetchGrants]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Grant Context Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">User Information</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(userInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Grants</h2>
          <button
            onClick={fetchGrants}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Grants'}
          </button>
        </div>
        
        {grants.length === 0 ? (
          <div className="text-gray-500">No grants found</div>
        ) : (
          <div className="grid gap-4">
            {grants.map((grant) => (
              <div key={grant.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{grant.title}</h3>
                <p className="text-sm text-gray-600">Status: {grant.status}</p>
                <p className="text-sm text-gray-600">Organization: {grant.organization_id}</p>
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(grant, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
