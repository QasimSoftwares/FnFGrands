import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { assignOrganizationToUser } from '@/lib/organization-utils';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { userId, organizationName } = await request.json();
  
  if (!userId) {
    return new NextResponse('User ID is required', { status: 400 });
  }

  try {
    const result = await assignOrganizationToUser(userId, organizationName);
    
    if (result.error) {
      console.error('Error assigning organization:', result.error);
      return new NextResponse(result.error, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in assign-organization API:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
