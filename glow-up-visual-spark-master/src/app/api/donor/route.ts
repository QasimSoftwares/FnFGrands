import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

// Helper to create consistent error responses
const createErrorResponse = (message: string, status: number) => {
  return new NextResponse(
    JSON.stringify({ error: message }),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      } 
    }
  );
};

// Helper to create consistent success responses
const createSuccessResponse = (data: any) => {
  return new NextResponse(
    JSON.stringify(data),
    { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      } 
    }
  );
};

async function validateSession(cookieStore: ReturnType<typeof cookies>) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // First try to get the session from the cookie
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If no session from cookie, check Authorization header
    if ((!session || sessionError) && request.headers.has('authorization')) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          // Create a session object from the token
          session = {
            access_token: token,
            token_type: 'bearer',
            user: data.user,
            expires_in: 3600, // Default expiration
            expires_at: Math.floor(Date.now() / 1000) + 3600, // Current time + 1 hour
            refresh_token: ''
          };
          sessionError = null;
        }
      }
    }
    
    if (sessionError) {
      console.error('Session validation error:', sessionError);
      return { session: null, error: 'Session validation error' };
    }
    
    if (!session) {
      console.error('No active session found');
      return { session: null, error: 'Not authenticated' };
    }
    
    return { session, error: null };
  } catch (error) {
    console.error('Error validating session:', error);
    return { session: null, error: 'Internal server error' };
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const { session, error: sessionError } = await validateSession(cookieStore);
    
    if (sessionError) {
      return createErrorResponse(sessionError, 401);
    }
    
    if (!session) {
      return createErrorResponse('Not authenticated - please sign in', 401);
    }

    // Get the current user's donor status and roles in a single query
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('donor_status, user_roles_denorm(*)')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching donor status:', profileError);
      return createErrorResponse('Failed to fetch donor status', 500);
    }

    // Check if user already has donor role
    const hasDonorRole = profileData?.user_roles_denorm?.some(
      (role: any) => role.role === 'donor' && role.user_id === session.user.id
    );

    if (hasDonorRole) {
      return createSuccessResponse({
        status: 'approved',
        request: null
      });
    }

    // Get any existing donor requests
    const { data: donorRequest, error: requestError } = await supabase
      .from('donor_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (requestError) {
      console.error('Error fetching donor request:', requestError);
      return createErrorResponse('Failed to fetch donor request', 500);
    }

    return createSuccessResponse({
      status: donorRequest?.status || 'none',
      request: donorRequest
    });
    
  } catch (error) {
    console.error('Error in GET /api/donor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse(errorMessage, 500);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const { session, error: sessionError } = await validateSession(cookieStore);
    
    if (sessionError) {
      return createErrorResponse(sessionError, 401);
    }
    
    if (!session) {
      return createErrorResponse('Not authenticated - please sign in', 401);
    }

    // Check if user already has a donor role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles_denorm')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('role', 'donor')
      .maybeSingle();

    if (roleCheckError) {
      console.error('Error checking existing roles:', roleCheckError);
      return createErrorResponse('Failed to check existing roles', 500);
    }

    if (existingRole) {
      return createErrorResponse('You are already a donor', 400);
    }

    // Check for existing pending or approved requests
    const { data: existingRequest, error: requestCheckError } = await supabase
      .from('donor_requests')
      .select('status')
      .eq('user_id', session.user.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (requestCheckError) {
      console.error('Error checking existing requests:', requestCheckError);
      return createErrorResponse('Failed to check existing requests', 500);
    }

    if (existingRequest) {
      return createErrorResponse(
        existingRequest.status === 'approved' 
          ? 'You are already a donor' 
          : 'Request already pending',
        400
      );
    }

    // Use a transaction to ensure both operations succeed or fail together
    const { data: newRequest, error } = await supabase.rpc('create_donor_request', {
      p_user_id: session.user.id
    });

    if (error) {
      console.error('Error in create_donor_request RPC:', error);
      return createErrorResponse('Failed to submit donor request', 500);
    }

    if (!newRequest) {
      return createErrorResponse('Failed to create donor request', 500);
    }

    return createSuccessResponse({
      status: 'pending',
      request: newRequest
    });
    
  } catch (error) {
    console.error('Error in POST /api/donor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse(errorMessage, 500);
  }
}
