"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGrants } from "@/contexts/grant-context";
import { Grant } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeletedGrantsPage() {
  const { restoreGrant, loading } = useGrants();
  const [deletedGrants, setDeletedGrants] = useState<Grant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  async function fetchDeletedGrants() {
    setLocalLoading(true);
    try {
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient();
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      setDeletedGrants(data || []);
    } catch (err) {
      setDeletedGrants([]);
      // Optionally toast or log error
    } finally {
      setLocalLoading(false);
    }
  }

  useEffect(() => {
    fetchDeletedGrants();
  }, []);

  const handleRestore = async (id: string) => {
    await restoreGrant(id);
    fetchDeletedGrants();
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Deleted Grants</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchDeletedGrants} disabled={refreshing || loading || localLoading} className="mb-4">
            Refresh
          </Button>
          {localLoading ? (
            <div>Loading...</div>
          ) : (
            <ul>
              {deletedGrants && deletedGrants.length > 0 ? (
                deletedGrants.map((grant: Grant) => (
                  <li key={grant.id} className="mb-4 border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong>{grant.name}</strong> (ID: {grant.id})<br />
                        Deleted At: {grant.deleted_at}
                      </div>
                      <Button onClick={() => handleRestore(grant.id)} variant="outline" size="sm">
                        Restore
                      </Button>
                    </div>
                  </li>
                ))
              ) : (
                <div>No deleted grants found.</div>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
