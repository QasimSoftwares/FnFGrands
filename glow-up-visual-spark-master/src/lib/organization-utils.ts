import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';

type OrganizationResult = {
  data?: { organization_id: string };
  error?: string;
};

export async function assignOrganizationToUser(
  userId: string, 
  organizationName?: string
): Promise<OrganizationResult> {
  const supabase = createClient();
  
  try {
    // Get user's profile to check if they already have an organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    
    // If user already has an organization, return it
    if (profile?.organization_id) {
      return { data: { organization_id: profile.organization_id } };
    }

    // Create a new organization if name is provided
    const orgName = organizationName || `Organization-${Date.now()}`;
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Database['public']['Tables']['organizations']['Insert'])
      .select('id')
      .single();

    if (orgError) throw orgError;
    if (!newOrg?.id) throw new Error('Failed to create organization');

    // Update user's profile with the new organization
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        organization_id: newOrg.id,
        updated_at: new Date().toISOString()
      } as Database['public']['Tables']['profiles']['Update'])
      .eq('id', userId);

    if (updateError) throw updateError;

    return { data: { organization_id: newOrg.id } };
  } catch (error) {
    console.error('Error assigning organization:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to assign organization' 
    };
  }
}
