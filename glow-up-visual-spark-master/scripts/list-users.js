const { createClient } = require('../src/lib/supabase/server');

async function listUsers() {
  const supabase = createClient();
  
  // List all users from auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching users:', authError);
    return;
  }

  // Get profiles with organization_id
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log('\n=== Users and Their Profiles ===');
  users.forEach(user => {
    const profile = profiles.find(p => p.id === user.id);
    console.log('\nUser ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Profile:', {
      full_name: profile?.full_name,
      organization_id: profile?.organization_id,
      created_at: profile?.created_at
    });
  });
  
  console.log('\n=== End of User List ===');
}

listUsers().catch(console.error);
