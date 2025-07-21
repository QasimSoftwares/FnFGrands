import { createClient } from '../src/lib/supabase/server';

async function updateUserOrganization(userId: string, organizationId: string) {
  const supabase = createClient();
  
  // Update the user's profile with the organization_id
  const { data, error } = await supabase
    .from('profiles')
    .update({ organization_id: organizationId })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user organization:', error);
    return;
  }

  console.log(`Successfully updated user ${userId} with organization_id: ${organizationId}`);
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: ts-node update-user-org.ts <userId> <organizationId>');
  process.exit(1);
}

const [userId, organizationId] = args;
updateUserOrganization(userId, organizationId);
