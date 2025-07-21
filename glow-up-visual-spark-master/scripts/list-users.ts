import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  console.log('Fetching users from Supabase...');
  
  try {
    // First, get all users from the auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} auth users`);
    
    // Then, get all profiles from the public.profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles?.length || 0} profiles`);
    
    // Combine the data
    const usersWithRoles = authUsers.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        role: profile?.role || 'no-role',
        lastSignIn: user.last_sign_in_at,
        created: user.created_at,
        rawProfile: profile
      };
    });
    
    console.log('Users with roles:');
    console.table(usersWithRoles);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

listUsers();
