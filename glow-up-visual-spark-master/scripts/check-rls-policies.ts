import { createClient } from '@/lib/supabase/client';

async function checkRLSPolicies() {
  const supabase = createClient();
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Not authenticated:', userError?.message || 'No user found');
      return;
    }
    
    console.log('Current user:', {
      id: user.id,
      email: user.email,
      role: user.role || 'unknown',
      is_authenticated: true
    });
    
    // Get user's role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    } else {
      console.log('User role from profiles table:', profile.role);
    }
    
    // Get RLS policies for grants table
    const { data: policies, error: policiesError } = await supabase.rpc(
      'get_policies_for_table',
      { table_name: 'grants' }
    );
    
    if (policiesError) {
      console.error('Error fetching RLS policies:', policiesError);
      
      // If the RPC function doesn't exist, try a direct query
      console.log('\nTrying direct query to pg_policy...');
      const { data: directPolicies, error: directError } = await supabase
        .from('pg_policy')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'grants');
      
      if (directError) {
        console.error('Error querying pg_policy:', directError);
      } else {
        console.log('Direct RLS policies for grants table:', directPolicies);
      }
      
      return;
    }
    
    console.log('\nCurrent RLS policies for grants table:');
    console.table(policies);
    
    // Check if admin has necessary permissions
    if (profile?.role === 'admin') {
      console.log('\nChecking admin permissions...');
      
      // Try to insert a test grant
      const testGrant = {
        name: 'Admin Test Grant',
        donor: 'Test Donor',
        type: 'New',
        category: 'Education',
        amount: 1000,
        status: 'Draft',
        applied_date: new Date().toISOString(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: user.id,
        organization_id: 'default-org',
        created_by: user.id,
        updated_by: user.id,
      };
      
      console.log('\nAttempting to insert test grant...');
      const { data: insertedGrant, error: insertError } = await supabase
        .from('grants')
        .insert(testGrant)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting test grant:', insertError);
      } else {
        console.log('Successfully inserted test grant:', insertedGrant);
        
        // Clean up
        await supabase
          .from('grants')
          .delete()
          .eq('id', insertedGrant.id);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRLSPolicies();
