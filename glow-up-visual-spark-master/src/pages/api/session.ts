import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { serialize, parse } from 'cookie';

// Initialize Supabase client (admin privileges for DB writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for DB writes
);

const SESSION_COOKIE = 'grant_tracker_session';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Correct type for cookie lib
  path: '/',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create session
    const { user_id, persistent } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const token = uuidv4();
    const now = new Date();
    // 30 days for persistent, 1 hour for non-persistent
    const expires = new Date(now.getTime() + (persistent ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
    // Insert into DB with correct expiry and persistent flag
    const { error } = await supabase.from('sessions').insert([
      {
        user_id,
        token,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
        persistent,
        revoked: false,
      },
    ]);
    if (error) {
      console.error('Session API error:', error);
      return res.status(500).json({ error: error.message });
    }
    // Set cookie: persistent gets expires, non-persistent gets session cookie
    const cookieOptions = {
      ...SESSION_COOKIE_OPTIONS,
      ...(persistent ? { expires } : {}),
    };
    res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, token, cookieOptions));
    return res.status(200).json({ token, expires_at: expires.toISOString() });
  }
  if (req.method === 'DELETE') {
    // Revoke session
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[SESSION_COOKIE];
    if (!token) return res.status(400).json({ error: 'No session token' });
    await supabase.from('sessions').update({ revoked: true }).eq('token', token);
    res.setHeader('Set-Cookie', serialize(SESSION_COOKIE, '', {
      ...SESSION_COOKIE_OPTIONS,
      expires: new Date(0),
    }));
    return res.status(200).json({ success: true });
  }
  if (req.method === 'GET') {
    // Validate session: must not be revoked or expired in DB
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: 'No session token' });
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();
    if (error || !data) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    if (data.revoked) {
      return res.status(401).json({ error: 'Session revoked' });
    }
    if (new Date(data.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    return res.status(200).json({ session: data });
  }
  res.setHeader('Allow', ['POST', 'DELETE', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
