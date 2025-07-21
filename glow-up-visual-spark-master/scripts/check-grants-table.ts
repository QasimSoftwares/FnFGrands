import { createClient } from '@/lib/supabase/client';

async function checkGrantsTable() {
  const supabase = createClient();
  
  try {
    // Check if we can query the grants table
    console.log('Checking grants table...');
    
    // Get the first row to check structure (if any rows exist)
    const { data: sampleGrant, error: fetchError } = await supabase
      .from('grants')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error querying grants table:', fetchError);
      return;
    }
    
    console.log('Sample grant (first row):', sampleGrant);
    
    // Try to insert a test grant
    console.log('\nAttempting to insert a test grant...');
    const testGrant = {
      name: 'Test Grant',
      donor: 'Test Donor',
      type: 'New',
      category: 'Education',
      amount: 1000,
      status: 'Draft',
      applied_date: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user_id: (await supabase.auth.getUser()).data.user?.id,
      organization_id: 'default-org',
      created_by: (await supabase.auth.getUser()).data.user?.id,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    };
    
    const { data: insertedGrant, error: insertError } = await supabase
      .from('grants')
      .insert(testGrant)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting test grant:', insertError);
      
      // Check RLS policies
      console.log('\nChecking RLS policies...');
      const { data: policies, error: policyError } = await supabase
        .rpc('get_policies_for_table', { table_name: 'grants' })
        .select();
      
      if (policyError) {
        console.error('Error checking RLS policies:', policyError);
      } else {
        console.log('Current RLS policies on grants table:', policies);
      }
      
      return;
    }
    
    console.log('Successfully inserted test grant:', insertedGrant);
    
    // Clean up - delete the test grant
    await supabase
      .from('grants')
      .delete()
      .eq('id', insertedGrant.id);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkGrantsTable();
