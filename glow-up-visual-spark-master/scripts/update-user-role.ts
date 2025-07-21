import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Need service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserRole(userId: string, newRole: string) {
  console.log(`Updating user ${userId} role to ${newRole}...`);
  
  try {
    // Update the profile with the new role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select('*');
    
    if (error) {
      console.error('Error updating user role:', error);
      return;
    }
    
    console.log('Successfully updated user role:');
    console.log(data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('Usage: npx ts-node scripts/update-user-role.ts <user-id> <role>');
  console.log('Example: npx ts-node scripts/update-user-role.ts 123e4567-e89b-12d3-a456-426614174000 admin');
  process.exit(1);
}

const [userId, newRole] = args;
updateUserRole(userId, newRole);
