// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const PENDING_COOKIE = 'pending_email';

function mapReason(raw?: string | null) {
  const r = (raw || '').toLowerCase();
  if (r.includes('access_denied')) return 'That link was already used or expired.';
  if (r.includes('expired')) return 'That link expired.';
  if (r.includes('invalid')) return 'That link was invalid.';
  return 'That link was invalid or expired.';
}

function signinRedirect(origin: string, email?: string | null, reason?: string | null) {
  const target = new URL('/signin', origin);
  target.searchParams.set('invalidLink', '1');
  if (email) target.searchParams.set('email', email);
  if (reason) target.searchParams.set('reason', mapReason(reason));
  return target;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';

  // Prefer param, then cookie
  const email = url.searchParams.get('email') || req.cookies.get(PENDING_COOKIE)?.value || undefined;

  // Provider error or missing code → bounce to /signin with context
  const providerErr = url.searchParams.get('error') || url.searchParams.get('error_description');
  if (!code || providerErr) {
    return NextResponse.redirect(signinRedirect(url.origin, email, providerErr ?? 'invalid_or_expired_link'));
  }

  // Try to exchange the code for a session
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(signinRedirect(url.origin, email, error.message));
  }

  // Success → clear cookie and continue
  const res = NextResponse.redirect(new URL(nextPath, url.origin));
  res.cookies.set(PENDING_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}