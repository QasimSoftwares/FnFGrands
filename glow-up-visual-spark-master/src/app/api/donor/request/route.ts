import { cookies, headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookies()
    });

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Not authenticated - please sign in' },
        { status: 401 }
      );
    }

    // Check if user already has a donor role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles_denorm')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'donor')
      .maybeSingle();

    if (roleCheckError) {
      console.error('Error checking existing roles:', roleCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing roles' },
        { status: 500 }
      );
    }

    if (existingRole) {
      return NextResponse.json(
        { error: 'You are already a donor' },
        { status: 400 }
      );
    }

    // Check for existing pending or approved requests
    const { data: existingRequest, error: requestCheckError } = await supabase
      .from('donor_requests')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (requestCheckError) {
      console.error('Error checking existing requests:', requestCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing requests' },
        { status: 500 }
      );
    }

    if (existingRequest) {
      const message = existingRequest.status === 'approved' 
        ? 'You are already a donor' 
        : 'Request already pending';
      
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    // Create a new donor request
    const { data: newRequest, error: createError } = await supabase
      .from('donor_requests')
      .insert([{
        user_id: user.id,
        status: 'pending',
        requested_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError || !newRequest) {
      console.error('Error creating donor request:', createError);
      return NextResponse.json(
        { error: 'Failed to create donor request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'pending',
      request: newRequest
    });
    
  } catch (error) {
    console.error('Error in POST /api/donor/request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
// This is necessary for development with different ports
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
